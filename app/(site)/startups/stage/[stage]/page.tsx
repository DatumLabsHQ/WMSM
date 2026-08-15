import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HubPage } from '@/components/hubs/HubPage';
import { getPlaceHubs, getSectorHubs, getStageHub, getStageHubs } from '@/lib/hubs';

export async function generateStaticParams() {
  const hubs = await getStageHubs();
  return hubs.map((h) => ({ stage: h.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ stage: string }> }): Promise<Metadata> {
  const { stage } = await params;
  const hub = await getStageHub(stage);
  if (!hub) return { title: 'Not found' };
  return { title: hub.heading, description: hub.intro, alternates: { canonical: `/startups/stage/${hub.slug}` } };
}

export default async function StageHub({ params }: { params: Promise<{ stage: string }> }) {
  const { stage } = await params;
  const hub = await getStageHub(stage);
  if (!hub) notFound();

  const [sectors, places, stages] = await Promise.all([getSectorHubs(), getPlaceHubs(), getStageHubs()]);

  return (
    <HubPage
      heading={hub.heading}
      intro={hub.intro}
      companies={hub.companies}
      linkGroups={[
        { title: 'Other stages', links: stages.map((s) => ({ href: `/startups/stage/${s.slug}`, label: s.label, count: s.count, active: s.slug === hub.slug })) },
        { title: 'By sector', links: sectors.map((s) => ({ href: `/startups/${s.slug}`, label: s.label, count: s.count })) },
        { title: 'By place', links: places.map((p) => ({ href: `/startups/in/${p.slug}`, label: p.label, count: p.count })) },
      ]}
    />
  );
}
