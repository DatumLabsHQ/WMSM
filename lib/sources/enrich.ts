import 'server-only';
import { prisma } from '@/lib/db';

/**
 * Candidate enrichment.
 *
 * The one job an importer cannot do is write the sentence that says what a company
 * actually does. But most companies have already written it — in their own meta
 * description, their og:description, or their title tag. Fetching that turns the
 * reviewer's job from "write a one-liner" into "approve or fix a one-liner", which
 * is the difference between a queue you work through and one you avoid.
 *
 * It also answers a question no database can: does the website still respond? A
 * dead site is the strongest cheap signal that a Companies House row is a shell.
 */

const META_PATTERNS = [
  /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{20,300})["']/i,
  /<meta[^>]+content=["']([^"']{20,300})["'][^>]+property=["']og:description["']/i,
  /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{20,300})["']/i,
  /<meta[^>]+content=["']([^"']{20,300})["'][^>]+name=["']description["']/i,
];
const TITLE = /<title[^>]*>([^<]{3,120})<\/title>/i;

/**
 * Real pages are full of numeric entities — `&#x27;` for an apostrophe, `&#8211;`
 * for an en dash, `&#x20;` for a plain space. An earlier version only handled
 * named ones, so blurbs arrived reading "Europe&#x27;s&#x20;leading". Numeric
 * forms are decoded first, then named, and `&amp;` last so it cannot double-decode
 * something it already produced.
 */
export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ' ';
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ' ';
    })
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ndash;|&mdash;/g, '–')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/&amp;/g, '&');
}

/** Exported so already-stored blurbs can be repaired without refetching. */
export function cleanBlurb(raw: string): string {
  return decodeEntities(raw).replace(/\s+/g, ' ').trim();
}

/** House style: one line, sentence case, no trailing full stop, under 140 characters. */
function tidy(raw: string, companyName: string): string {
  let text = decodeEntities(raw).replace(/\s+/g, ' ').trim();

  // Sites overwhelmingly open with "Acme Ltd | " or "Acme — ". Strip it; the card
  // already shows the name directly above the line.
  const escaped = companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  text = text.replace(new RegExp(`^${escaped}\\s*[|\\-–—:]\\s*`, 'i'), '');
  text = text.replace(/\s*[|\-–—]\s*(home|homepage|official site|welcome)\s*$/i, '');
  text = text.replace(/^(welcome to|home)\s+/i, '');

  if (text.length > 140) text = `${text.slice(0, 139).replace(/\s+\S*$/, '')}…`;
  return text.replace(/\.$/, '').trim();
}

/* ------------------------------------------------------------ domain guess --- */

/** Legal suffixes and filler that never appear in a domain. */
const NAME_NOISE = /\b(limited|ltd|plc|llp|lp|uk|group|holdings|company|co|the|international|services|solutions)\b/gi;

/**
 * Neither Companies House nor Gateway to Research publishes a website, which
 * leaves the single most useful field empty on every imported candidate. Most
 * small companies, though, own the obvious domain.
 *
 * So: strip the legal suffix, try the handful of TLDs a UK startup actually uses,
 * and — the part that matters — only accept a hit if the page itself mentions the
 * company. Without that check this finds a parked domain for almost everything.
 */
export function candidateDomains(name: string): string[] {
  const core = name
    .replace(NAME_NOISE, ' ')
    .replace(/[^a-z0-9\s-]/gi, ' ')
    .trim()
    .toLowerCase();

  if (!core || core.length < 3) return [];

  const joined = core.replace(/[\s-]+/g, '');
  const hyphenated = core.replace(/[\s-]+/g, '-');
  if (joined.length < 3 || joined.length > 30) return [];

  const stems = joined === hyphenated ? [joined] : [joined, hyphenated];
  const tlds = ['co.uk', 'com', 'io', 'uk'];
  return stems.flatMap((stem) => tlds.map((tld) => `${stem}.${tld}`));
}

/** Distinctive words from the name, used to confirm a domain is really theirs. */
function nameTokens(name: string): string[] {
  return name
    .replace(NAME_NOISE, ' ')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4)
    .map((w) => w.toLowerCase());
}

export async function discoverWebsite(name: string): Promise<string | null> {
  const tokens = nameTokens(name);
  if (!tokens.length) return null;

  for (const domain of candidateDomains(name)) {
    try {
      const res = await fetch(`https://${domain}`, {
        redirect: 'follow',
        headers: { 'user-agent': 'WestMidlandsStartupMap/1.0 (+https://westmidlandsstartupmap.com)' },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;

      const html = (await res.text()).slice(0, 60_000).toLowerCase();
      // A parked domain resolves and returns 200. Only the company's own name in
      // its own page separates a real site from a squatter.
      if (tokens.some((t) => html.includes(t))) return domain;
    } catch {
      // DNS failure, timeout, bad certificate — all just mean "not this one".
    }
  }

  return null;
}

export interface EnrichResult {
  ok: boolean;
  blurb: string | null;
}

export async function fetchDescription(website: string, companyName: string): Promise<EnrichResult> {
  const origin = website.startsWith('http') ? website : `https://${website}`;

  let html: string;
  try {
    const res = await fetch(origin, {
      redirect: 'follow',
      headers: { 'user-agent': 'WestMidlandsStartupMap/1.0 (+https://westmidlandsstartupmap.com)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, blurb: null };
    html = (await res.text()).slice(0, 120_000);
  } catch {
    return { ok: false, blurb: null };
  }

  for (const pattern of META_PATTERNS) {
    const found = html.match(pattern)?.[1];
    if (found) {
      const blurb = tidy(found, companyName);
      if (blurb.length >= 15) return { ok: true, blurb };
    }
  }

  // A title tag is weaker but better than an empty field for the reviewer to react to.
  const title = html.match(TITLE)?.[1];
  if (title) {
    const blurb = tidy(title, companyName);
    if (blurb.length >= 15) return { ok: true, blurb };
  }

  // The site answered, which is the signal that matters most, even with nothing to read.
  return { ok: true, blurb: null };
}

export async function enrichCandidate(id: string): Promise<boolean> {
  const candidate = await prisma.candidate.findUnique({ where: { id }, select: { website: true, name: true } });
  if (!candidate?.website) return false;

  const { ok, blurb } = await fetchDescription(candidate.website, candidate.name);
  await prisma.candidate.update({
    where: { id },
    data: { blurb: blurb ?? undefined, websiteOk: ok, enrichedAt: new Date() },
  });
  return ok;
}

export interface EnrichSummary {
  tried: number;
  /** Candidates that arrived with no website and now have one. */
  found: number;
  reachable: number;
  described: number;
}

/**
 * Batch pass, working the top of the queue first because that is where a reviewer
 * actually is. For each candidate: find the website if it has none, then read it.
 *
 * Runs a handful at a time — these are other people's servers, and it stays well
 * short of anything that would look like hammering.
 */
export async function enrichCandidates(limit = 40): Promise<EnrichSummary> {
  const pending = await prisma.candidate.findMany({
    where: { status: 'new', enrichedAt: null },
    orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
    select: { id: true, website: true, name: true },
    take: limit,
  });

  const summary: EnrichSummary = { tried: pending.length, found: 0, reachable: 0, described: 0 };

  for (let i = 0; i < pending.length; i += 4) {
    const batch = pending.slice(i, i + 4);
    await Promise.all(
      batch.map(async (c) => {
        let website = c.website;

        if (!website) {
          website = await discoverWebsite(c.name);
          if (website) summary.found += 1;
        }

        if (!website) {
          await prisma.candidate.update({
            where: { id: c.id },
            data: { websiteOk: false, enrichedAt: new Date() },
          });
          return;
        }

        const result = await fetchDescription(website, c.name);
        if (result.ok) summary.reachable += 1;
        if (result.blurb) summary.described += 1;

        await prisma.candidate.update({
          where: { id: c.id },
          data: {
            website,
            blurb: result.blurb ?? undefined,
            websiteOk: result.ok,
            enrichedAt: new Date(),
            // A live site the company clearly owns is worth real points.
            score: { increment: result.ok ? 15 : 0 },
          },
        });
      }),
    );
  }

  return summary;
}
