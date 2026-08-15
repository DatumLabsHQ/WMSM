import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HubPage } from '@/components/hubs/HubPage';
import { getPlaceHub, getPlaceHubs, getSectorHubs, getStageHubs } from '@/lib/hubs';

export async function generateStaticParams() {
  const hubs = await getPlaceHubs();
  return hubs.map((h) => ({ place: h.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ place: string }> }): Promise<Metadata> {
  const { place } = await params;
  const hub = await getPlaceHub(place);
  if (!hub) return { title: 'Not found' };
  return { title: hub.heading, description: hub.intro, alternates: { canonical: `/startups/in/${hub.slug}` } };
}

export default async function PlaceHub({ params }: { params: Promise<{ place: string }> }) {
  const { place } = await params;
  const hub = await getPlaceHub(place);
  if (!hub) notFound();

  const [sectors, places, stages] = await Promise.all([getSectorHubs(), getPlaceHubs(), getStageHubs()]);

  return (
    <HubPage
      heading={hub.heading}
      intro={hub.intro}
      companies={hub.companies}
      linkGroups={[
        { title: 'Other places', links: places.map((p) => ({ href: `/startups/in/${p.slug}`, label: p.label, count: p.count, active: p.slug === hub.slug })) },
        { title: 'By sector', links: sectors.map((s) => ({ href: `/startups/${s.slug}`, label: s.label, count: s.count })) },
        { title: 'By stage', links: stages.map((s) => ({ href: `/startups/stage/${s.slug}`, label: s.label, count: s.count })) },
      ]}
    />
  );
}
