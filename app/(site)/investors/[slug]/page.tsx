import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ds/Card';
import { ListingRow } from '@/components/ds/ListingRow';
import { HubPage } from '@/components/hubs/HubPage';
import { getInvestorHub, getInvestorHubs, getSectorHubs } from '@/lib/hubs';
import { fullDate, money, plural } from '@/lib/format';

export async function generateStaticParams() {
  const hubs = await getInvestorHubs();
  return hubs.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const hub = await getInvestorHub(slug);
  if (!hub) return { title: 'Not found' };
  const total = hub.rounds.reduce((n, r) => n + r.amountGbp, 0);
  return {
    title: `${hub.name} — West Midlands investments`,
    description: `${hub.name} has backed ${plural(hub.companies.length, 'company', 'companies')} in the West Midlands across ${plural(hub.rounds.length, 'round')}, ${money(total)} in announced value.`,
    alternates: { canonical: `/investors/${hub.slug}` },
  };
}

export default async function InvestorHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hub = await getInvestorHub(slug);
  if (!hub) notFound();

  const [investors, sectors] = await Promise.all([getInvestorHubs(), getSectorHubs()]);
  const total = hub.rounds.reduce((n, r) => n + r.amountGbp, 0);
  const first = hub.rounds[hub.rounds.length - 1];

  return (
    <HubPage
      heading={`${hub.name} in the West Midlands`}
      intro={`${hub.name} appears on ${plural(hub.rounds.length, 'announced round')} across ${plural(
        hub.companies.length,
        'company',
        'companies',
      )} here, ${money(total)} in total value. First recorded ${fullDate(new Date(first.announced))}.`}
      companies={hub.companies}
      linkGroups={[
        {
          title: 'Other investors',
          links: investors.slice(0, 24).map((i) => ({ href: `/investors/${i.slug}`, label: i.name, count: i.count, active: i.slug === hub.slug })),
        },
        { title: 'By sector', links: sectors.map((s) => ({ href: `/startups/${s.slug}`, label: s.label, count: s.count })) },
      ]}
    >
      <Card padding="var(--space-6)" elevation="hairline" style={{ marginBottom: 'var(--space-10)' }}>
        <h2 style={{ font: 'var(--type-h2)', marginBottom: 'var(--space-4)' }}>Rounds in the region</h2>
        {hub.rounds.map((r) => (
          <ListingRow
            key={r.id}
            icon="banknote"
            iconTone="var(--brass-600)"
            title={`${r.companyName} — ${money(r.amountGbp)} ${r.stage}`}
            meta={[fullDate(new Date(r.announced))]}
            href={`/company/${r.companySlug}#funding`}
          />
        ))}
        <p className="wm-data" style={{ color: 'var(--text-muted)', margin: 'var(--space-4) 0 0' }}>
          Announced rounds only — undisclosed money is not counted, so this is a floor.{' '}
          <Link href="/method">How we count</Link>
        </p>
      </Card>
    </HubPage>
  );
}
