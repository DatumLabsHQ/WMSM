import 'server-only';
import { emptySummary, tally, upsertCandidate, type ImportSummary } from '@/lib/candidates';
import { inRegion } from '@/lib/sic';

/**
 * UKRI Gateway to Research — https://gtr.ukri.org/
 *
 * Free, no key, no registration, and it covers Innovate UK as well as the seven
 * research councils. This is the best available signal for separating a real
 * operating company from a dormant shell: someone assessed them and gave them
 * money for research.
 *
 * Organisations carry a company number, a website and a postcode, and link to the
 * projects they were funded for — so a candidate arrives with its own evidence.
 *
 * Two API quirks, both found the hard way: the versioned `Accept` headers in the
 * older docs return 406, and page size must be at least 10.
 */

const BASE = 'https://gtr.ukri.org/gtr/api';

interface GtrAddress {
  postCode?: string | null;
  city?: string | null;
  region?: string | null;
}

interface GtrOrganisation {
  id: string;
  name: string;
  website?: string | null;
  regNumber?: string | null;
  addresses?: { address?: GtrAddress[] } | null;
  links?: { link?: { href: string; rel: string }[] } | null;
}

interface GtrPage {
  totalPages?: number;
  totalSize?: number;
  organisation?: GtrOrganisation[];
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Terms chosen to span the six sectors rather than to be exhaustive. */
export const DEFAULT_GTR_QUERIES = [
  'robotics',
  'battery',
  'hydrogen',
  'diagnostics',
  'medical device',
  'machine learning',
  'additive manufacturing',
  'games',
  'fintech',
  'sensors',
  'net zero',
  'digital health',
];

export interface GtrImportOptions {
  queries?: string[];
  /** Pages per query, 10 organisations each. */
  pagesPerQuery?: number;
  onProgress?: (query: string, kept: number) => void;
}

export async function importFromGtr(options: GtrImportOptions = {}): Promise<ImportSummary> {
  const queries = options.queries ?? DEFAULT_GTR_QUERIES;
  const pages = options.pagesPerQuery ?? 3;
  const summary = emptySummary();

  for (const query of queries) {
    let keptForQuery = 0;

    for (let page = 1; page <= pages; page += 1) {
      const data = await getJson<GtrPage>(`${BASE}/organisations?q=${encodeURIComponent(query)}&s=10&p=${page}`);
      const orgs = data?.organisation ?? [];
      if (!orgs.length) break;

      for (const org of orgs) {
        summary.scanned += 1;

        const address = org.addresses?.address?.[0];
        const postcode = address?.postCode?.trim() ?? '';
        // Region is UKRI's own label and is the cheaper check; postcode is the
        // authoritative one because plenty of rows have no region set.
        if (!postcode || !inRegion(postcode)) continue;

        const projectCount = (org.links?.link ?? []).filter((l) => l.rel === 'PROJECT').length;

        keptForQuery += 1;
        tally(
          summary,
          await upsertCandidate({
            source: 'gtr',
            sourceRef: org.id,
            name: org.name,
            website: org.website ?? null,
            postcode,
            locality: address?.city ?? null,
            companyNumber: org.regNumber ?? null,
            note: `UKRI-funded, matched "${query}"${projectCount ? ` · ${projectCount} funded project${projectCount === 1 ? '' : 's'}` : ''}`,
            signals: projectCount > 1 ? [`${projectCount} UKRI projects`] : [],
          }),
        );
      }

      if ((data?.totalPages ?? 1) <= page) break;
    }

    options.onProgress?.(query, keptForQuery);
  }

  return summary;
}
