'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ds/Card';
import { EmptyState } from '@/components/ds/EmptyState';
import { ListingRow } from '@/components/ds/ListingRow';
import { Tabs } from '@/components/ds/Tabs';
import type { IconName } from '@/components/ds/Icon';

export interface FeedRow {
  id: string;
  title: string;
  subtitle?: string;
  meta: string[];
  href?: string;
}

export interface Feed {
  key: string;
  label: string;
  icon: IconName;
  tone: string;
  rows: FeedRow[];
  emptyTitle: string;
  emptyMessage: string;
}

export function BoardFeeds({ feeds }: { feeds: Feed[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get('feed');
  const active = feeds.some((f) => f.key === requested) ? (requested as string) : feeds[0].key;
  const feed = feeds.find((f) => f.key === active)!;

  const select = (key: string) => {
    const sp = new URLSearchParams(params.toString());
    sp.set('feed', key);
    router.replace(`${pathname}?${sp}`, { scroll: false });
  };

  return (
    <Card padding="var(--space-6)" elevation="hairline">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-5)' }}>
        <Tabs
          variant="segmented"
          label="Feeds"
          tabs={feeds.map((f) => ({ value: f.key, label: f.label, count: f.rows.length }))}
          value={active}
          onChange={select}
        />
      </div>
      {feed.rows.length ? (
        feed.rows.map((r) => (
          <ListingRow key={r.id} icon={feed.icon} iconTone={feed.tone} title={r.title} subtitle={r.subtitle} meta={r.meta} href={r.href} />
        ))
      ) : (
        <EmptyState icon={feed.icon} title={feed.emptyTitle} message={feed.emptyMessage} />
      )}
    </Card>
  );
}
