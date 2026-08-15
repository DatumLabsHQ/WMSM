import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ds/Card';
import { Icon } from '@/components/ds/Icon';
import { BoardFeeds, type Feed } from '@/components/site/BoardFeeds';
import { DigestSignup } from '@/components/site/DigestSignup';
import { getEvents, getPerks, getRegionStats, getRounds, getSectors, getSpaces } from '@/lib/queries';
import { count, eventDate, eventTime, money, shortDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Funding',
  description:
    'Every raise, event and partner perk across the West Midlands, with the regional numbers computed from the listings themselves.',
};

export default async function FundingPage() {
  const [stats, sectors, rounds, events, perks, spaces] = await Promise.all([
    getRegionStats(),
    getSectors(),
    getRounds(40),
    getEvents(10),
    getPerks(),
    getSpaces(),
  ]);

  const feeds: Feed[] = [
    {
      key: 'funding',
      label: 'Funding',
      icon: 'banknote',
      tone: 'var(--brass-600)',
      emptyTitle: 'No rounds logged yet',
      emptyMessage: 'Raises are added as they are announced, with the investors named.',
      rows: rounds.map((r) => ({
        id: r.id,
        title: `${r.companyName} raised ${money(r.amountGbp)} ${r.stage}`,
        meta: [shortDate(new Date(r.announced)), r.investors],
        href: `/company/${r.companySlug}#funding`,
      })),
    },
    {
      key: 'events',
      label: 'Events',
      icon: 'calendar',
      tone: 'var(--sector-creative)',
      emptyTitle: 'Nothing in the diary',
      emptyMessage: 'Running something in the region? Send it over and we will list it.',
      rows: events.map((e) => ({
        id: e.id,
        title: e.title,
        subtitle: `${e.venue}, ${e.locality}`,
        meta: [eventDate(new Date(e.startsAt)), eventTime(new Date(e.startsAt))],
      })),
    },
    {
      key: 'perks',
      label: 'Perks',
      icon: 'gift',
      tone: 'var(--copper-600)',
      emptyTitle: 'No perks live',
      emptyMessage: 'We negotiate these one partner at a time. Verified listings hear first.',
      rows: perks.map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: p.blurb,
        meta: [p.partner, p.eligible],
      })),
    },
    {
      key: 'spaces',
      label: 'Spaces',
      icon: 'building-2',
      tone: 'var(--route-600)',
      emptyTitle: 'No spaces listed',
      emptyMessage: 'Desks, studios and incubators across the region will appear here.',
      rows: spaces.map((s) => ({
        id: s.id,
        title: s.name,
        subtitle: `${s.locality}, ${s.postcode}`,
        meta: [s.deskNote],
      })),
    },
  ];

  const figures: [string, string, string][] = [
    [money(stats.raisedThisYear), `Raised in ${stats.raisedYear}`, `${stats.outsideBirminghamPct}% outside Birmingham`],
    [count(stats.activeInvestors), 'Investors active in 12 months', 'Named on a round'],
    [count(rounds.length), 'Rounds on record', 'Announced only'],
    [count(stats.companies), 'Companies mapped', `Across ${count(stats.authorities)} areas`],
  ];

  return (
    <>
      <section className="wm-hero">
        <h1>Money moving in the West Midlands</h1>
        <p>
          Every raise we can source, the events worth turning up to, and the perks that come with a listing. Computed from the map,
          not estimated. <Link href="/method">See the method</Link>.
        </p>
      </section>

      <div className="wm-page" style={{ paddingBottom: 'var(--space-24)', display: 'grid', gap: 'var(--space-8)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
          {figures.map(([value, label, note]) => (
            <Card key={label} padding="var(--space-5)" elevation="hairline">
              <div
                style={{
                  font: 'var(--weight-bold) var(--text-2xl)/1.05 var(--font-display)',
                  letterSpacing: 'var(--tracking-display)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {value}
              </div>
              <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', marginTop: 6 }}>{label}</div>
              <div className="wm-data" style={{ color: 'var(--text-muted)', marginTop: 2 }}>
                {note}
              </div>
            </Card>
          ))}
        </div>

        <Suspense fallback={<Card padding="var(--space-6)">Loading feeds…</Card>}>
          <BoardFeeds feeds={feeds} />
        </Suspense>

        <Card padding="var(--space-5)" elevation="hairline">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <Icon name="layers" size={16} color="var(--text-muted)" />
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)' }}>Browse by cluster</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
              {sectors.map((s) => (
                <Link key={s.slug} href={`/?sector=${s.slug}`} className="ds-chip">
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
                  {s.label} {count(s.count)}
                </Link>
              ))}
            </div>
          </div>
        </Card>

        <DigestSignup source="funding" />
      </div>
    </>
  );
}
