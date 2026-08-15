import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ds/Button';
import { Card } from '@/components/ds/Card';
import { SectionHeader } from '@/components/ds/SectionHeader';
import { getRegionStats } from '@/lib/queries';
import { count, fullDate, money } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Method',
  description: 'How the West Midlands Startup Map counts what it counts, what it does not know, and how to correct it.',
};

export default async function MethodPage() {
  const stats = await getRegionStats();

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 var(--space-6) var(--space-24)' }}>
      <section className="wm-hero">
        <h1>How these numbers are counted</h1>
        <p>
          Every figure on this site is computed from the listings in the database when the page is built. None of them are
          estimates, and none are rounded up.
        </p>
      </section>

      <Card padding="var(--space-6)" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ font: 'var(--type-h3)', marginBottom: 12 }}>Definitions</h3>
        <dl style={{ display: 'grid', gap: 'var(--space-4)', margin: 0 }}>
          {[
            ['Companies mapped', `Published listings with a location inside the region. Today: ${count(stats.companies)}.`],
            [
              `Raised in ${stats.raisedYear}`,
              `The sum of announced rounds dated this calendar year, for companies on the map. Today: ${money(stats.raisedThisYear)}. Undisclosed rounds count as zero, so this is a floor, not a total.`,
            ],
            ['Open roles', `Live roles posted by listed companies. Today: ${count(stats.openRoles)}. Agency reposts are not accepted.`],
            [
              'Investors active in 12 months',
              `Distinct named investors on rounds announced in the last 365 days. Today: ${count(stats.activeInvestors)}. "Angels" is not counted as a name.`,
            ],
            [
              'Money raised outside Birmingham',
              `Share of this year's round value from companies whose local authority is not Birmingham. Today: ${stats.outsideBirminghamPct}%.`,
            ],
            ['Verified', `A person confirmed the company exists and works here. Today: ${count(stats.verified)} of ${count(stats.companies)}.`],
            [
              'Claimed',
              `Someone at the company controls the listing. Unclaimed listings were compiled by us and may be out of date — today ${count(stats.unclaimed)} are unclaimed.`,
            ],
          ].map(([term, body]) => (
            <div key={term}>
              <dt style={{ font: 'var(--weight-semibold) var(--text-base)/1.3 var(--font-display)', marginBottom: 4 }}>{term}</dt>
              <dd style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', margin: 0 }}>{body}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card padding="var(--space-6)" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ font: 'var(--type-h3)', marginBottom: 12 }}>What this map does not know</h3>
        <ul style={{ font: 'var(--type-body)', color: 'var(--text-secondary)', margin: 0, paddingLeft: '1.2em', display: 'grid', gap: 8 }}>
          <li>Rounds that were never announced. Plenty of the region&rsquo;s money moves quietly.</li>
          <li>Headcount between updates. Bands come from the company and drift.</li>
          <li>Companies that have quietly closed. Tell us and we will mark them.</li>
          <li>Anything about revenue. We do not ask and would not publish it.</li>
        </ul>
        <p className="wm-data" style={{ color: 'var(--text-muted)', margin: 'var(--space-5) 0 0' }}>
          Last movement recorded {fullDate(new Date(stats.refreshedAt))}
        </p>
      </Card>

      <Card padding="var(--space-6)" style={{ marginBottom: 'var(--space-6)' }} id="corrections">
        <h3 style={{ font: 'var(--type-h3)', marginBottom: 12 }}>Corrections</h3>
        <p style={{ font: 'var(--type-body)', color: 'var(--text-secondary)' }}>
          If something here is wrong, it is our error, not yours to live with. Claim the listing from its profile page and tell us what
          to change — that route reaches a person, and there is no charge for it either way.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <ButtonLink href="/map">Find your listing</ButtonLink>
          <ButtonLink href="/add" variant="secondary">
            Add a missing company
          </ButtonLink>
        </div>
      </Card>

      <Card padding="var(--space-6)" id="who">
        <h3 style={{ font: 'var(--type-h3)', marginBottom: 12 }}>Who runs this</h3>
        <p style={{ font: 'var(--type-body)', color: 'var(--text-secondary)', margin: 0 }}>
          An independent project, not a government body and not owned by an investor. It stays free for the companies on it. If that
          ever changes, this page says so first.
        </p>
      </Card>
    </div>
  );
}
