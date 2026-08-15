import 'server-only';
import { prisma } from '@/lib/db';
import type { IconName } from '@/lib/icons.generated';

/**
 * Every figure the site prints is computed here from the database. Nothing is
 * hardcoded: if the map holds 39 companies, the hero says 39. That is the whole
 * pitch — the data is the product, so it is never decorated.
 */

export interface SectorView {
  id: string;
  slug: string;
  label: string;
  color: string;
  icon: IconName;
  blurb: string;
  count: number;
}

export interface CompanyView {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  sector: string;
  sectorSlug: string;
  sectorColor: string;
  sectorIcon: IconName;
  stage: string;
  headcount: string;
  location: string;
  authority: string;
  lat: number;
  lng: number;
  founded: number;
  raisedGbp: number;
  website: string | null;
  logoUrl: string | null;
  hiring: boolean;
  verified: boolean;
  claimed: boolean;
  openRoles: number;
}

export interface JobView {
  id: string;
  title: string;
  discipline: string;
  arrangement: string;
  locality: string;
  salaryLabel: string;
  salaryFloor: number;
  postedAt: string;
  companyName: string;
  companySlug: string;
  sector: string;
  sectorColor: string;
}

export interface RoundView {
  id: string;
  stage: string;
  amountGbp: number;
  announced: string;
  investors: string;
  companyName: string;
  companySlug: string;
}

const PUBLISHED = { status: 'published' } as const;

export async function getSectors(): Promise<SectorView[]> {
  const sectors = await prisma.sector.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { companies: { where: PUBLISHED } } } },
  });
  return sectors.map((s) => ({
    id: s.id,
    slug: s.slug,
    label: s.label,
    color: s.colorVar,
    icon: s.icon as IconName,
    blurb: s.blurb,
    count: s._count.companies,
  }));
}

function toCompanyView(c: {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  stage: string;
  headcount: string;
  locality: string;
  postcode: string;
  authority: string;
  lat: number;
  lng: number;
  founded: number;
  raisedGbp: number;
  website: string | null;
  logoUrl: string | null;
  hiring: boolean;
  verified: boolean;
  claimed: boolean;
  sector: { label: string; slug: string; colorVar: string; icon: string };
  _count: { jobs: number };
}): CompanyView {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    blurb: c.blurb,
    sector: c.sector.label,
    sectorSlug: c.sector.slug,
    sectorColor: c.sector.colorVar,
    sectorIcon: c.sector.icon as IconName,
    stage: c.stage,
    headcount: c.headcount,
    location: `${c.locality}, ${c.postcode.split(' ')[0]}`,
    authority: c.authority,
    lat: c.lat,
    lng: c.lng,
    founded: c.founded,
    raisedGbp: c.raisedGbp,
    website: c.website,
    logoUrl: c.logoUrl,
    hiring: c.hiring,
    verified: c.verified,
    claimed: c.claimed,
    openRoles: c._count.jobs,
  };
}

const companyInclude = {
  sector: { select: { label: true, slug: true, colorVar: true, icon: true } },
  _count: { select: { jobs: true } },
} as const;

/** Every published company. The explorer filters client-side so the map never round-trips. */
export async function getCompanies(): Promise<CompanyView[]> {
  const rows = await prisma.company.findMany({
    where: PUBLISHED,
    include: companyInclude,
    orderBy: { name: 'asc' },
  });
  return rows.map(toCompanyView);
}

export async function getCompany(slug: string) {
  const c = await prisma.company.findFirst({
    where: { slug, ...PUBLISHED },
    include: {
      ...companyInclude,
      rounds: { orderBy: { announced: 'desc' } },
      jobs: { orderBy: { postedAt: 'desc' } },
    },
  });
  if (!c) return null;

  return {
    ...toCompanyView(c),
    about: c.about,
    postcode: c.postcode,
    rounds: c.rounds.map((r) => ({
      id: r.id,
      stage: r.stage,
      amountGbp: r.amountGbp,
      announced: r.announced.toISOString(),
      investors: r.investors,
    })),
    jobs: c.jobs.map((j) => ({
      id: j.id,
      title: j.title,
      discipline: j.discipline,
      arrangement: j.arrangement,
      locality: j.locality,
      salaryLabel: j.salaryLabel,
      postedAt: j.postedAt.toISOString(),
    })),
  };
}

export type CompanyDetail = NonNullable<Awaited<ReturnType<typeof getCompany>>>;

export async function getCompanySlugs(): Promise<string[]> {
  const rows = await prisma.company.findMany({ where: PUBLISHED, select: { slug: true } });
  return rows.map((r) => r.slug);
}

/** Same sector, nearest first by straight-line distance. Cheap, and good enough at this scale. */
export async function getSimilarCompanies(slug: string, limit = 4): Promise<CompanyView[]> {
  const me = await prisma.company.findFirst({ where: { slug, ...PUBLISHED }, select: { id: true, sectorId: true, lat: true, lng: true } });
  if (!me) return [];
  const rows = await prisma.company.findMany({
    where: { ...PUBLISHED, sectorId: me.sectorId, NOT: { id: me.id } },
    include: companyInclude,
  });
  return rows
    .map(toCompanyView)
    .sort((a, b) => (a.lat - me.lat) ** 2 + (a.lng - me.lng) ** 2 - ((b.lat - me.lat) ** 2 + (b.lng - me.lng) ** 2))
    .slice(0, limit);
}

export async function getJobs(): Promise<JobView[]> {
  const rows = await prisma.job.findMany({
    where: { company: PUBLISHED },
    orderBy: { postedAt: 'desc' },
    include: { company: { select: { name: true, slug: true, sector: { select: { label: true, colorVar: true } } } } },
  });
  return rows.map((j) => ({
    id: j.id,
    title: j.title,
    discipline: j.discipline,
    arrangement: j.arrangement,
    locality: j.locality,
    salaryLabel: j.salaryLabel,
    salaryFloor: j.salaryFloor,
    postedAt: j.postedAt.toISOString(),
    companyName: j.company.name,
    companySlug: j.company.slug,
    sector: j.company.sector.label,
    sectorColor: j.company.sector.colorVar,
  }));
}

export async function getRounds(limit?: number): Promise<RoundView[]> {
  const rows = await prisma.round.findMany({
    where: { company: PUBLISHED },
    orderBy: { announced: 'desc' },
    take: limit,
    include: { company: { select: { name: true, slug: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    stage: r.stage,
    amountGbp: r.amountGbp,
    announced: r.announced.toISOString(),
    investors: r.investors,
    companyName: r.company.name,
    companySlug: r.company.slug,
  }));
}

export async function getEvents(limit?: number) {
  const rows = await prisma.event.findMany({ orderBy: { startsAt: 'asc' }, take: limit });
  return rows.map((e) => ({ ...e, startsAt: e.startsAt.toISOString() }));
}

export async function getPerks(limit?: number) {
  return prisma.perk.findMany({ orderBy: { sortOrder: 'asc' }, take: limit });
}

export async function getSpaces(limit?: number) {
  return prisma.space.findMany({ orderBy: { name: 'asc' }, take: limit });
}

export interface RegionStats {
  companies: number;
  openRoles: number;
  raisedThisYear: number;
  raisedYear: number;
  activeInvestors: number;
  newThisQuarter: number;
  quarter: string;
  outsideBirminghamPct: number;
  unclaimed: number;
  verified: number;
  authorities: number;
  fastestSector: string | null;
  refreshedAt: string;
}

function quarterStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3, 1));
}

/** Everything the marketing site and the board print, derived in one pass. */
export async function getRegionStats(now: Date = new Date()): Promise<RegionStats> {
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const qStart = quarterStart(now);
  const twelveMonthsAgo = new Date(now.getTime() - 365 * 86_400_000);

  const [companies, openRoles, verified, unclaimed, companyRows, roundRows] = await Promise.all([
    prisma.company.count({ where: PUBLISHED }),
    prisma.job.count({ where: { company: PUBLISHED } }),
    prisma.company.count({ where: { ...PUBLISHED, verified: true } }),
    prisma.company.count({ where: { ...PUBLISHED, claimed: false } }),
    prisma.company.findMany({
      where: PUBLISHED,
      select: { authority: true, createdAt: true, sector: { select: { label: true } } },
    }),
    prisma.round.findMany({
      where: { company: PUBLISHED },
      select: { amountGbp: true, announced: true, investors: true, company: { select: { authority: true } } },
    }),
  ]);

  const thisYear = roundRows.filter((r) => r.announced >= yearStart);
  const raisedThisYear = thisYear.reduce((n, r) => n + r.amountGbp, 0);
  const outside = thisYear.filter((r) => r.company.authority !== 'Birmingham').reduce((n, r) => n + r.amountGbp, 0);

  const investors = new Set<string>();
  for (const r of roundRows) {
    if (r.announced < twelveMonthsAgo) continue;
    for (const name of r.investors.split('·').map((s) => s.trim())) {
      if (name && name.toLowerCase() !== 'angels') investors.add(name);
    }
  }

  const newThisQuarter = companyRows.filter((c) => c.createdAt >= qStart).length;

  const bySector = new Map<string, number>();
  for (const c of companyRows) bySector.set(c.sector.label, (bySector.get(c.sector.label) ?? 0) + 1);
  const fastestSector = [...bySector.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const lastRefresh = roundRows.reduce<Date | null>((latest, r) => (!latest || r.announced > latest ? r.announced : latest), null);

  return {
    companies,
    openRoles,
    raisedThisYear,
    raisedYear: now.getUTCFullYear(),
    activeInvestors: investors.size,
    newThisQuarter,
    quarter: `Q${Math.floor(now.getUTCMonth() / 3) + 1} ${now.getUTCFullYear()}`,
    outsideBirminghamPct: raisedThisYear ? Math.round((outside / raisedThisYear) * 100) : 0,
    unclaimed,
    verified,
    authorities: new Set(companyRows.map((c) => c.authority)).size,
    fastestSector,
    refreshedAt: (lastRefresh ?? now).toISOString(),
  };
}
