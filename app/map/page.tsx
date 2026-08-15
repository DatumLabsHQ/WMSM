export const revalidate = 3600;

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TopBar } from '@/components/site/TopBar';
import { MapExplorer } from '@/components/map/MapExplorer';
import { getMapPoints } from '@/lib/mapdata';
import { getSectors } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'The map',
  description:
    'Startups, events and workspaces across Birmingham, Solihull, Coventry, Warwickshire and the Black Country, plotted on one map.',
};

export default async function MapPage() {
  const [points, sectors] = await Promise.all([getMapPoints(), getSectors()]);
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar />
      <Suspense fallback={null}>
        <MapExplorer points={points} sectors={sectors} />
      </Suspense>
    </div>
  );
}
