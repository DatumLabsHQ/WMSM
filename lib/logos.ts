import 'server-only';
import { prisma } from '@/lib/db';

/**
 * Logo resolution.
 *
 * We do not invent a company's mark, and we do not want to run an upload pipeline
 * before there is anything to upload. So the first pass is to look for one the
 * company already publishes: an apple-touch-icon or a favicon on its own domain.
 * Anything found is stored as a URL — we never rehost someone's logo.
 *
 * A company can always be given an exact logo by hand in /admin/companies, and
 * that always wins over anything discovered here.
 */

const ICON_PATTERN = /<link[^>]+rel=["'][^"']*(?:apple-touch-icon|icon)[^"']*["'][^>]*>/gi;
const HREF_PATTERN = /href=["']([^"']+)["']/i;
const SIZES_PATTERN = /sizes=["'](\d+)x\d+["']/i;

function absolute(href: string, origin: string): string | null {
  try {
    return new URL(href, origin).href;
  } catch {
    return null;
  }
}

/** Returns the largest declared icon, or null if the site does not declare one. */
export async function discoverLogo(website: string): Promise<string | null> {
  const origin = website.startsWith('http') ? website : `https://${website}`;

  let html: string;
  try {
    const res = await fetch(origin, {
      redirect: 'follow',
      headers: { 'user-agent': 'WestMidlandsStartupMap/1.0 (+https://westmidlandsstartupmap.com)' },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 604_800 },
    });
    if (!res.ok) return null;
    html = (await res.text()).slice(0, 200_000);
  } catch {
    return null;
  }

  const candidates: { url: string; size: number }[] = [];
  for (const tag of html.match(ICON_PATTERN) ?? []) {
    const href = tag.match(HREF_PATTERN)?.[1];
    if (!href) continue;
    const url = absolute(href, origin);
    if (!url) continue;
    const size = Number(tag.match(SIZES_PATTERN)?.[1] ?? (/apple-touch-icon/i.test(tag) ? 180 : 32));
    candidates.push({ url, size });
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.size - a.size);
  // Anything tiny is a browser-tab favicon and looks like grit on a gallery tile.
  return candidates[0].size >= 64 ? candidates[0].url : null;
}

export async function resolveLogo(companyId: string): Promise<boolean> {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { website: true } });
  if (!company?.website) return false;

  const logoUrl = await discoverLogo(company.website);
  if (!logoUrl) return false;

  await prisma.company.update({ where: { id: companyId }, data: { logoUrl } });
  return true;
}

/** Batch pass, run from /admin/companies or the daily cron. */
export async function backfillLogos(limit = 20): Promise<{ tried: number; found: number }> {
  const pending = await prisma.company.findMany({
    where: { logoUrl: null, status: 'published', NOT: { website: null } },
    select: { id: true },
    take: limit,
  });

  let found = 0;
  for (const c of pending) if (await resolveLogo(c.id)) found += 1;
  return { tried: pending.length, found };
}
