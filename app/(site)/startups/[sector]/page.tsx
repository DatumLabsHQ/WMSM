import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HubPage } from '@/components/hubs/HubPage';
import { getPlaceHubs, getSectorHub, getSectorHubs, getStageHubs } from '@/lib/hubs';

export async function generateStaticParams() {
  const hubs = await getSectorHubs();
  return hubs.map((h) => ({ sector: h.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ sector: string }> }): Promise<Metadata> {
  const { sector } = await params;
  const hub = await getSectorHub(sector);
  if (!hub) return { title: 'Not found' };
  return {
    title: hub.heading,
    description: hub.intro,
    alternates: { canonical: `/startups/${hub.slug}` },
  };
}

export default async function SectorHub({ params }: { params: Promise<{ sector: string }> }) {
  const { sector } = await params;
  const hub = await getSectorHub(sector);
  if (!hub) notFound();

  const [sectors, places, stages] = await Promise.all([getSectorHubs(), getPlaceHubs(), getStageHubs()]);

  return (
    <HubPage
      heading={hub.heading}
      intro={hub.intro}
      companies={hub.companies}
      linkGroups={[
        {
          title: 'Other sectors',
          links: sectors.map((s) => ({ href: `/startups/${s.slug}`, label: s.label, count: s.count, active: s.slug === hub.slug })),
        },
        { title: 'By place', links: places.map((p) => ({ href: `/startups/in/${p.slug}`, label: p.label, count: p.count })) },
        { title: 'By stage', links: stages.map((s) => ({ href: `/startups/stage/${s.slug}`, label: s.label, count: s.count })) },
      ]}
    >
      {hub.blurb ? (
        <p style={{ font: 'var(--type-body)', color: 'var(--text-secondary)', maxWidth: '62ch', margin: '0 auto var(--space-10)', textAlign: 'center' }}>
          {hub.blurb}
        </p>
      ) : null}
    </HubPage>
  );
}
