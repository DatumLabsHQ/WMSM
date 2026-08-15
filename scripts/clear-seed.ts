/**
 * Remove the invented seed content from a database.
 *
 *   npm run db:clear-seed          show what would go
 *   npm run db:clear-seed -- --yes actually delete it
 *
 * The 39 seeded companies, their rounds and roles, the seeded articles, events,
 * perks and spaces are all placeholders — plausible-looking fiction written so the
 * app was never empty during development. On a site whose whole claim is that a
 * person checked the listings, they are the one thing that would genuinely damage
 * it, so they must not survive to production.
 *
 * Deletion is by the exact slugs the seed creates, read from prisma/seed.ts rather
 * than hardcoded here, so this can never drift from what the seed produces and can
 * never take a real listing with it. Anything accepted from the candidate queue is
 * untouched.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '../lib/prisma/generated/client.js';
import { PrismaNeon } from '@prisma/adapter-neon';

process.loadEnvFile(path.join(process.cwd(), '.env'));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Put the current Neon URL in .env first.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
const commit = process.argv.includes('--yes');

/** Every `slug: '…'` in the seed's company list. */
function seedSlugs(): string[] {
  const source = readFileSync(path.join(process.cwd(), 'prisma', 'seed.ts'), 'utf8');
  const companies = source.slice(source.indexOf('const COMPANIES'), source.indexOf('const EVENTS'));
  return [...companies.matchAll(/^\s{4}slug:\s*'([^']+)'/gm)].map((m) => m[1]);
}

const slugs = seedSlugs();
if (slugs.length < 20) {
  console.error(`Only found ${slugs.length} seed slugs — refusing to run in case the parse is wrong.`);
  process.exit(1);
}

/** A bad password here is the most likely failure by far, and a Prisma stack trace
 *  buries that in forty lines. Say what happened and what to do about it. */
async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/authentication failed|28P01/i.test(message)) {
      console.error('\nThe database rejected the password in .env.\n');
      console.error('  This normally means .env still has an old credential.');
      console.error('  Copy the current connection string from the Neon dashboard');
      console.error('  (or your Vercel environment variables) into .env as:\n');
      console.error('    DATABASE_URL="postgresql://…"\n');
      process.exit(1);
    }
    if (/ENOTFOUND|ECONNREFUSED|fetch failed/i.test(message)) {
      console.error('\nCould not reach the database. Check the host in DATABASE_URL and your connection.\n');
      process.exit(1);
    }
    throw error;
  }
}

const [companies, rounds, jobs, articles, events, perks, spaces, investors, accepted] = await guarded(() => Promise.all([
  prisma.company.count({ where: { slug: { in: slugs } } }),
  prisma.round.count({ where: { company: { slug: { in: slugs } } } }),
  prisma.job.count({ where: { company: { slug: { in: slugs } } } }),
  prisma.article.count(),
  prisma.event.count(),
  prisma.perk.count(),
  prisma.space.count(),
  prisma.investor.count(),
  prisma.company.count({ where: { slug: { notIn: slugs } } }),
]));

console.log(`\nSeed content found (${slugs.length} known seed slugs):\n`);
console.log(`  companies   ${companies}`);
console.log(`  rounds      ${rounds}   (cascade)`);
console.log(`  roles       ${jobs}   (cascade)`);
console.log(`  articles    ${articles}`);
console.log(`  events      ${events}`);
console.log(`  perks       ${perks}`);
console.log(`  spaces      ${spaces}`);
console.log(`  investors   ${investors}`);
console.log(`\n  companies NOT from the seed, which stay: ${accepted}\n`);

if (!commit) {
  console.log('Dry run. Re-run with --yes to delete.\n');
  await prisma.$disconnect();
  process.exit(0);
}

// Order matters where there is no cascade.
await prisma.articleTag.deleteMany();
await prisma.article.deleteMany();
await prisma.roundInvestor.deleteMany();
await prisma.investor.deleteMany();
await prisma.companySnapshot.deleteMany({ where: { company: { slug: { in: slugs } } } });
await prisma.company.deleteMany({ where: { slug: { in: slugs } } });
await prisma.event.deleteMany();
await prisma.perk.deleteMany();
await prisma.space.deleteMany();

const left = await prisma.company.count();
console.log(`Done. ${left} companies remain — all of them real.\n`);

await prisma.$disconnect();
process.exit(0);
