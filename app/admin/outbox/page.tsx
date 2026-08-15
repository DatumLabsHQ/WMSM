import { Card } from '@/components/ds/Card';
import { EmptyState } from '@/components/ds/EmptyState';
import { Badge } from '@/components/ds/Badge';
import { prisma } from '@/lib/db';
import { retryEmail } from '../actions';
import { fullDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

const TONE = { sent: 'success', queued: 'warning', failed: 'danger', skipped: 'neutral' } as const;

export default async function AdminOutbox() {
  const messages = await prisma.emailMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  const provider = process.env.EMAIL_PROVIDER ?? 'outbox';

  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
      <div>
        <h1 style={{ font: 'var(--type-h1)' }}>Outbox</h1>
        <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', marginTop: 8 }}>
          Every message is written here before a provider is called, so nothing is lost when the transport is missing or down.
          Current provider: <code>{provider}</code>
          {provider === 'outbox' ? ' — messages queue and are never actually sent.' : '.'}
        </p>
      </div>

      {messages.length ? (
        <Card padding="var(--space-5)" elevation="hairline">
          {messages.map((m) => (
            <div key={m.id} className="ds-row">
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ font: 'var(--type-ui)' }}>{m.subject}</span>
                <br />
                <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
                  {m.to} · {m.template} · {fullDate(m.createdAt)} · {m.attempts} attempt{m.attempts === 1 ? '' : 's'}
                  {m.error ? ` · ${m.error.slice(0, 80)}` : ''}
                </span>
              </span>
              <Badge tone={TONE[m.status as keyof typeof TONE] ?? 'neutral'}>{m.status}</Badge>
              {m.status !== 'sent' ? (
                <form action={retryEmail}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="ds-btn ds-btn--secondary ds-btn--sm">
                    Retry
                  </button>
                </form>
              ) : null}
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState icon="mail" title="Nothing sent yet" message="Messages appear here the moment anything is queued." />
      )}
    </div>
  );
}
