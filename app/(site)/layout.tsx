/* The directory is prerendered, but listings change. An hour is short enough that a
   newly approved company appears the same morning, long enough to stay cheap. */
export const revalidate = 3600;

import { TopBar } from '@/components/site/TopBar';
import { SiteFooter } from '@/components/site/SiteFooter';
import { getRegionStats } from '@/lib/queries';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const stats = await getRegionStats();
  return (
    <>
      <a className="wm-skip" href="#main">
        Skip to content
      </a>
      <TopBar />
      <main id="main">{children}</main>
      <SiteFooter refreshedAt={stats.refreshedAt} />
    </>
  );
}
