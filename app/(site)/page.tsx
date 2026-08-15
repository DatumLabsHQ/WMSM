import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Gallery } from '@/components/gallery/Gallery';
import { FundingTicker } from '@/components/gallery/FundingTicker';
import { getCompanies, getRegionStats, getRounds, getSectors } from '@/lib/queries';
import { count } from '@/lib/format';

export const metadata: Metadata = {
  description:
    'A gallery of every startup we can verify in Birmingham, Solihull, Coventry, Warwickshire and the Black Country, plus the jobs and funding behind them.',
};

export default async function HomePage() {
  const [companies, sectors, rounds, stats] = await Promise.all([getCompanies(), getSectors(), getRounds(14), getRegionStats()]);

  const areas = [...new Set(companies.map((c) => c.authority))].sort();

  // Newest first is the gallery's default order — a wall of raises reads as a
  // ranking, and this is a directory, not a league table.
  const wall = [...companies].sort((a, b) => b.founded - a.founded || a.name.localeCompare(b.name));

  return (
    <>
      <section className="wm-hero">
        <h1>Discover West Midlands startups</h1>
        <p>
          {stats.companies
            ? `A gallery of ${count(stats.companies)} companies across Birmingham, Solihull, Coventry, Warwickshire and the Black Country, plus the roles and funding behind them. Checked by a person.`
            : 'Birmingham, Solihull, Coventry, Warwickshire and the Black Country. The first listings are being checked now — every one is read by a person before it appears.'}
        </p>
      </section>

      {/* The ticker hides itself with no rounds; the link under it has to go too,
          or an empty map shows a lone "See all funding" pointing at nothing. */}
      {rounds.length ? (
        <div className="wm-page" style={{ marginBottom: 'var(--space-14)' }}>
          <FundingTicker rounds={rounds} />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-3)' }}>
            <Link href="/funding" style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
              See all funding →
            </Link>
          </div>
        </div>
      ) : null}

      <Suspense fallback={null}>
        <Gallery companies={wall} sectors={sectors} areas={areas} />
      </Suspense>
    </>
  );
}
