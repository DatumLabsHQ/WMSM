import 'server-only';
import { prisma } from '@/lib/db';
import { WM_BOUNDS } from '@/lib/geo';

/**
 * UK postcode lookup via postcodes.io — free, no key, no rate limit worth worrying
 * about at this scale. Approving a submission used to drop the pin at the region
 * centre for someone to move by hand; this closes that.
 *
 * A postcode that resolves outside the region is rejected rather than plotted:
 * a company in Leeds on a West Midlands map is worse than no company.
 */
export interface GeocodeResult {
  lat: number;
  lng: number;
  /** postcodes.io's own names, used to fill locality and authority. */
  locality: string;
  authority: string;
  postcode: string;
}

const AUTHORITY_GROUPS: Record<string, string> = {
  Birmingham: 'Birmingham',
  Solihull: 'Solihull',
  Coventry: 'Coventry',
  Wolverhampton: 'Black Country',
  Dudley: 'Black Country',
  Sandwell: 'Black Country',
  Walsall: 'Black Country',
};

/** Everything in Warwickshire and Staffordshire that we cover reports as its district. */
function groupAuthority(district: string): string {
  return AUTHORITY_GROUPS[district] ?? 'Warwickshire';
}

export async function geocodePostcode(postcode: string): Promise<GeocodeResult | null> {
  const clean = postcode.trim().toUpperCase();
  if (!clean) return null;

  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`, {
      // Postcodes rarely move; a long cache keeps repeat approvals instant.
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return null;

    const body = (await res.json()) as {
      result?: {
        latitude: number;
        longitude: number;
        postcode: string;
        admin_district: string;
        admin_ward?: string;
        parish?: string;
      };
    };
    const r = body.result;
    if (!r || typeof r.latitude !== 'number') return null;

    const inRegion =
      r.latitude <= WM_BOUNDS.north &&
      r.latitude >= WM_BOUNDS.south &&
      r.longitude >= WM_BOUNDS.west &&
      r.longitude <= WM_BOUNDS.east;
    if (!inRegion) return null;

    return {
      lat: r.latitude,
      lng: r.longitude,
      locality: r.admin_ward || r.parish || r.admin_district,
      authority: groupAuthority(r.admin_district),
      postcode: r.postcode,
    };
  } catch {
    return null;
  }
}

/** Used on approval and by the backfill in /admin. */
export async function geocodeCompany(companyId: string): Promise<boolean> {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { postcode: true } });
  if (!company) return false;

  const point = await geocodePostcode(company.postcode);
  if (!point) return false;

  await prisma.company.update({
    where: { id: companyId },
    data: {
      lat: point.lat,
      lng: point.lng,
      locality: point.locality,
      authority: point.authority,
      postcode: point.postcode,
      geocodedAt: new Date(),
    },
  });
  return true;
}

/**
 * Only ever touches rows that have never been resolved. Anything with `geocodedAt`
 * set — including the seed, whose points and locality names are hand-checked and
 * read better than the ONS ward names — is left alone. Use "Fix location" in
 * /admin/companies to override a specific one.
 */
export async function backfillGeocodes(limit = 25): Promise<{ tried: number; fixed: number }> {
  const pending = await prisma.company.findMany({
    where: { geocodedAt: null, status: 'published' },
    select: { id: true },
    take: limit,
  });

  let fixed = 0;
  for (const c of pending) if (await geocodeCompany(c.id)) fixed += 1;
  return { tried: pending.length, fixed };
}
