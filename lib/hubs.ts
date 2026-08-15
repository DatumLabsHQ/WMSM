import 'server-only';
import { prisma } from '@/lib/db';
import { getCompanies, type CompanyView } from '@/lib/queries';
import { slugify } from '@/lib/markdown';

/**
 * Hub pages exist to be found. Every one is generated from real rows, carries a
 * genuine count, and links sideways to its siblings — a page that is thin is a
 * page that gets ignored, so a hub with nothing behind it is never generated.
 */

/** Below this, a hub is thin content and we do not publish it. */
export const MIN_HUB_SIZE = 2;

export interface Hub {
  slug: string;
  label: string;
  /** Written into the H1. */
  heading: string;
  /** The paragraph under it — real numbers, real places. */
  intro: string;
  companies: CompanyView[];
}

const STAGE_SLUGS: Record<string, string> = {
  'pre-seed': 'Pre-seed',
  seed: 'Seed',
  'series-a': 'Series A',
  'series-b': 'Series B',
  bootstrapped: 'Bootstrapped',
};

function summarise(companies: CompanyView[]) {
  const raised = companies.reduce((n, c) => n + c.raisedGbp, 0);
  const hiring = companies.filter((c) => c.hiring).length;
  const roles = companies.reduce((n, c) => n + c.openRoles, 0);
  const places = [...new Set(companies.map((c) => c.location.split(',')[0]))];
  return { raised, hiring, roles, places };
}

/* ------------------------------------------------------------------ sector --- */

export async function getSectorHubs(): Promise<{ slug: string; label: string; count: number }[]> {
  const sectors = await prisma.sector.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { companies: { where: { status: 'published' } } } } },
  });
  return sectors.map((s) => ({ slug: s.slug, label: s.label, count: s._count.companies })).filter((s) => s.count >= MIN_HUB_SIZE);
}

export async function getSectorHub(slug: string): Promise<(Hub & { blurb: string }) | null> {
  const sector = await prisma.sector.findUnique({ where: { slug } });
  if (!sector) return null;

  const all = await getCompanies();
  const companies = all.filter((c) => c.sectorSlug === slug);
  if (companies.length < MIN_HUB_SIZE) return null;

  const { hiring, roles, places } = summarise(companies);
  return {
    slug,
    label: sector.label,
    blurb: sector.blurb,
    heading: `${sector.label} startups in the West Midlands`,
    intro: `${companies.length} ${sector.label.toLowerCase()} companies on the map, across ${places.slice(0, 3).join(', ')}${
      places.length > 3 ? ' and elsewhere' : ''
    }. ${hiring} are hiring, between them ${roles} open roles.`,
    companies,
  };
}

/* ------------------------------------------------------------------- place --- */

export async function getPlaceHubs(): Promise<{ slug: string; label: string; count: number }[]> {
  const companies = await getCompanies();
  const map = new Map<string, { label: string; count: number }>();
  for (const c of companies) {
    const key = slugify(c.authority);
    const entry = map.get(key);
    if (entry) entry.count += 1;
    else map.set(key, { label: c.authority, count: 1 });
  }
  return [...map.entries()]
    .map(([slug, v]) => ({ slug, ...v }))
    .filter((p) => p.count >= MIN_HUB_SIZE)
    .sort((a, b) => b.count - a.count);
}

export async function getPlaceHub(slug: string): Promise<Hub | null> {
  const all = await getCompanies();
  const companies = all.filter((c) => slugify(c.authority) === slug);
  if (companies.length < MIN_HUB_SIZE) return null;

  const label = companies[0].authority;
  const { hiring, roles, places } = summarise(companies);
  const sectors = [...new Set(companies.map((c) => c.sector))];

  return {
    slug,
    label,
    heading: `Startups in ${label}`,
    intro: `${companies.length} companies mapped in ${label}, strongest in ${sectors.slice(0, 2).join(' and ')}. ${hiring} are hiring — ${roles} open roles between them. Areas covered include ${places.slice(0, 4).join(', ')}.`,
    companies,
  };
}

/* ------------------------------------------------------------------- stage --- */

export async function getStageHubs(): Promise<{ slug: string; label: string; count: number }[]> {
  const companies = await getCompanies();
  return Object.entries(STAGE_SLUGS)
    .map(([slug, label]) => ({ slug, label, count: companies.filter((c) => c.stage === label).length }))
    .filter((s) => s.count >= MIN_HUB_SIZE);
}

export async function getStageHub(slug: string): Promise<Hub | null> {
  const label = STAGE_SLUGS[slug];
  if (!label) return null;

  const all = await getCompanies();
  const companies = all.filter((c) => c.stage === label);
  if (companies.length < MIN_HUB_SIZE) return null;

  const { hiring, roles } = summarise(companies);
  const sectors = [...new Set(companies.map((c) => c.sector))];

  return {
    slug,
    label,
    heading: `${label} startups in the West Midlands`,
    intro: `${companies.length} companies at ${label.toLowerCase()} on the map, spread across ${sectors.length} sectors. ${hiring} are hiring, ${roles} roles open.`,
    companies,
  };
}

/* ---------------------------------------------------------------- investor --- */

export interface InvestorHub {
  slug: string;
  name: string;
  kind: string;
  blurb: string;
  website: string | null;
  rounds: {
    id: string;
    stage: string;
    amountGbp: number;
    announced: string;
    companyName: string;
    companySlug: string;
  }[];
  companies: CompanyView[];
}

export async function getInvestorHubs(): Promise<{ slug: string; name: string; count: number }[]> {
  const investors = await prisma.investor.findMany({ include: { _count: { select: { rounds: true } } } });
  return investors
    .map((i) => ({ slug: i.slug, name: i.name, count: i._count.rounds }))
    .filter((i) => i.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getInvestorHub(slug: string): Promise<InvestorHub | null> {
  const investor = await prisma.investor.findUnique({
    where: { slug },
    include: {
      rounds: {
        include: { round: { include: { company: { select: { slug: true, name: true, status: true } } } } },
      },
    },
  });
  if (!investor) return null;

  const rounds = investor.rounds
    .map((ri) => ri.round)
    .filter((r) => r.company.status === 'published')
    .sort((a, b) => b.announced.getTime() - a.announced.getTime())
    .map((r) => ({
      id: r.id,
      stage: r.stage,
      amountGbp: r.amountGbp,
      announced: r.announced.toISOString(),
      companyName: r.company.name,
      companySlug: r.company.slug,
    }));

  if (!rounds.length) return null;

  const slugs = new Set(rounds.map((r) => r.companySlug));
  const companies = (await getCompanies()).filter((c) => slugs.has(c.slug));

  return {
    slug: investor.slug,
    name: investor.name,
    kind: investor.kind,
    blurb: investor.blurb,
    website: investor.website,
    rounds,
    companies,
  };
}
