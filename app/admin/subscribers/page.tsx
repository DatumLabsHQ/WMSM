import { Card } from '@/components/ds/Card';
import { EmptyState } from '@/components/ds/EmptyState';
import { Badge } from '@/components/ds/Badge';
import { prisma } from '@/lib/db';
import { count, fullDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

const TONE = { confirmed: 'success', pending: 'warning', unsubscribed: 'neutral', bounced: 'danger' } as const;

export default async function AdminSubscribers() {
  const [subscribers, confirmed, pending, unsubscribed] = await Promise.all([
    prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.subscriber.count({ where: { status: 'confirmed' } }),
    prisma.subscriber.count({ where: { status: 'pending' } }),
    prisma.subscriber.count({ where: { status: 'unsubscribed' } }),
  ]);

  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
      <div>
        <h1 style={{ font: 'var(--type-h1)' }}>Subscribers</h1>
        <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', marginTop: 8 }}>
          {count(confirmed)} confirmed · {count(pending)} awaiting confirmation · {count(unsubscribed)} unsubscribed. Only
          confirmed addresses are ever sent the digest.
        </p>
      </div>

      {subscribers.length ? (
        <Card padding="var(--space-5)" elevation="hairline">
          {subscribers.map((s) => (
            <div key={s.id} className="ds-row">
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ font: 'var(--type-ui)' }}>{s.email}</span>
                <br />
                <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
                  {s.postcode ? `${s.postcode} · ` : ''}
                  {s.topics} · from {s.source} · joined {fullDate(s.createdAt)}
                </span>
              </span>
              <Badge tone={TONE[s.status as keyof typeof TONE] ?? 'neutral'}>{s.status}</Badge>
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState icon="mail" title="No subscribers yet" message="They appear here as soon as anyone signs up." />
      )}
    </div>
  );
}
