import 'server-only';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { emptySummary, tally, upsertCandidate, type ImportSummary } from '@/lib/candidates';
import { inRegion, looksLikeTech, sicCodesFrom, sicLabel } from '@/lib/sic';

/**
 * Companies House free company data product.
 *
 *   https://download.companieshouse.gov.uk/en_output.html
 *   BasicCompanyDataAsOneFile-YYYY-MM-01.zip  — ~400MB zipped, ~2GB open, ~5M rows
 *
 * Streamed a line at a time because the file will not fit in memory, and filtered
 * hard: region by postcode, tech by SIC, live companies only. What survives is a
 * candidate, not a listing — SIC is self-declared and the registered address is
 * very often the company's accountant, so a person still decides.
 *
 * Run it with `npm run import:ch -- <path-to-csv>`.
 */

/** The header has stray spaces and dotted names; normalise before matching. */
function normaliseHeader(h: string): string {
  return h.replace(/^﻿/, '').trim().replace(/\./g, '_');
}

/** Minimal RFC4180 line parser — the file quotes fields containing commas. */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      out.push(field.trim());
      field = '';
    } else field += ch;
  }
  out.push(field.trim());
  return out;
}

export interface ChImportOptions {
  /** Skip anything incorporated before this. Defaults to 2010. */
  since?: number;
  /** Stop after this many candidates — useful for a first look. */
  limit?: number;
  onProgress?: (scanned: number, kept: number) => void;
}

export async function importCompaniesHouseCsv(path: string, options: ChImportOptions = {}): Promise<ImportSummary> {
  const since = options.since ?? 2010;
  const summary = emptySummary();

  const stream = createReadStream(path, { encoding: 'utf8' });
  const lines = createInterface({ input: stream, crlfDelay: Infinity });

  let header: string[] | null = null;
  let index: Record<string, number> = {};
  let kept = 0;

  for await (const line of lines) {
    if (!line.trim()) continue;

    if (!header) {
      header = parseCsvLine(line).map(normaliseHeader);
      index = Object.fromEntries(header.map((h, i) => [h, i]));
      continue;
    }

    summary.scanned += 1;
    if (summary.scanned % 100_000 === 0) options.onProgress?.(summary.scanned, kept);

    const row = parseCsvLine(line);
    const get = (key: string) => row[index[key]] ?? '';

    if (get('CompanyStatus') !== 'Active') continue;

    const postcode = get('RegAddress_PostCode');
    if (!postcode || !inRegion(postcode)) continue;

    const sicTexts = [
      get('SICCode_SicText_1'),
      get('SICCode_SicText_2'),
      get('SICCode_SicText_3'),
      get('SICCode_SicText_4'),
    ].filter(Boolean);

    const codes = sicCodesFrom(sicTexts);
    if (!looksLikeTech(codes)) continue;

    // Dates in this file are DD/MM/YYYY.
    const [d, m, y] = get('IncorporationDate').split('/');
    const incorporated = y ? new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))) : null;
    if (incorporated && incorporated.getUTCFullYear() < since) continue;

    kept += 1;
    tally(
      summary,
      await upsertCandidate({
        source: 'companies-house',
        sourceRef: get('CompanyNumber'),
        companyNumber: get('CompanyNumber'),
        name: get('CompanyName'),
        postcode,
        locality: get('RegAddress_PostTown') || null,
        sicCodes: codes,
        incorporated,
        note: sicTexts.map(sicLabel).join(' · '),
      }),
    );

    if (options.limit && kept >= options.limit) break;
  }

  lines.close();
  stream.destroy();
  options.onProgress?.(summary.scanned, kept);
  return summary;
}
