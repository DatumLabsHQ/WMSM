/**
 * Companies House bulk import.
 *
 *   curl -O https://download.companieshouse.gov.uk/BasicCompanyDataAsOneFile-2026-08-01.zip
 *   unzip BasicCompanyDataAsOneFile-2026-08-01.zip
 *   npm run import:ch -- BasicCompanyDataAsOneFile-2026-08-01.csv
 *
 * Options:
 *   --since 2010   ignore anything incorporated before this year
 *   --limit 500    stop after this many candidates, for a first look
 *
 * It is a command-line job rather than a button because the file is about 2GB and
 * five million rows — that is not something to run inside a request.
 */
import { importCompaniesHouseCsv } from '../lib/sources/companies-house.js';

const args = process.argv.slice(2);
const path = args.find((a) => !a.startsWith('--'));

function flag(name: string): number | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : undefined;
}

if (!path) {
  console.error('Usage: npm run import:ch -- <path-to-csv> [--since 2010] [--limit 500]');
  process.exit(1);
}

const started = Date.now();
console.log(`Reading ${path}\nFiltering to postcode areas B, CV, DY, WS, WV with tech SIC codes.\n`);

const summary = await importCompaniesHouseCsv(path, {
  since: flag('since'),
  limit: flag('limit'),
  onProgress: (scanned, kept) => {
    process.stdout.write(`\r  ${scanned.toLocaleString('en-GB')} rows scanned · ${kept.toLocaleString('en-GB')} candidates kept`);
  },
});

const seconds = Math.round((Date.now() - started) / 1000);
console.log(`\n\nDone in ${seconds}s.`);
console.log(`  scanned  ${summary.scanned.toLocaleString('en-GB')}`);
console.log(`  created  ${summary.created.toLocaleString('en-GB')}`);
console.log(`  updated  ${summary.updated.toLocaleString('en-GB')}`);
console.log(`  skipped  ${summary.skipped.toLocaleString('en-GB')} (already reviewed, or already on the map)`);
console.log('\nReview them at /admin/candidates. Nothing is public until accepted.');

process.exit(0);
