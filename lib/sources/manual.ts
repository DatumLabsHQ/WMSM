import 'server-only';
import { emptySummary, tally, upsertCandidate, type ImportSummary } from '@/lib/candidates';
import { inRegion } from '@/lib/sic';
import { slugify } from '@/lib/markdown';

/**
 * The paste-a-list importer.
 *
 * The highest-precision sources are not APIs — they are investor portfolio pages,
 * accelerator cohort lists, Silicon Canal's directory, tenant lists at Alpha Works
 * and Innovation Birmingham, TIGA members for Silicon Spa. Reading those and
 * pasting is faster than automating them, and the result is far cleaner.
 *
 * One company per line:
 *
 *   Name, website, postcode, note
 *   Kanda Robotics, kandarobotics.co.uk, B11 2AA, Midven portfolio
 *
 * Tabs, commas or pipes all work, so a paste out of a spreadsheet is fine.
 */

export interface ManualImportResult extends ImportSummary {
  /** Lines we could not use, with the reason, so nothing fails silently. */
  problems: { line: string; reason: string }[];
}

const POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})?\b/i;

export async function importPastedList(input: string, note = ''): Promise<ManualImportResult> {
  const summary = { ...emptySummary(), problems: [] as { line: string; reason: string }[] };

  const lines = input
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  for (const line of lines) {
    summary.scanned += 1;

    const parts = line.split(/\t|\||,/).map((p) => p.trim()).filter(Boolean);
    const name = parts[0];

    if (!name || name.length < 2) {
      summary.problems.push({ line, reason: 'no name' });
      continue;
    }

    const website = parts.find((p) => /\.[a-z]{2,}/i.test(p) && !POSTCODE.test(p) && p !== name);
    const postcodePart = parts.find((p) => POSTCODE.test(p) && p !== name && p !== website);

    if (!postcodePart) {
      summary.problems.push({ line, reason: 'no postcode — we map the pin from it' });
      continue;
    }

    const postcode = postcodePart.toUpperCase();
    if (!inRegion(postcode)) {
      summary.problems.push({ line, reason: `${postcode} is outside the region` });
      continue;
    }

    const extras = parts.filter((p) => p !== name && p !== website && p !== postcodePart);

    tally(
      summary,
      await upsertCandidate({
        source: 'manual',
        // Stable enough to re-run a corrected paste without duplicating.
        sourceRef: slugify(name),
        name,
        website: website ?? null,
        postcode,
        note: [note, ...extras].filter(Boolean).join(' · '),
      }),
    );
  }

  return summary;
}
