import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ds/Button';
import { EmptyState } from '@/components/ds/EmptyState';
import { confirmSubscriber } from '@/app/actions';

export const metadata: Metadata = { title: 'Confirm subscription', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const result = token ? await confirmSubscriber(token) : { ok: false as const };

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: 'var(--space-24) var(--space-6)' }}>
      {result.ok ? (
        <EmptyState
          icon="circle-check"
          title="You are on the list"
          message={`Confirmed${'email' in result && result.email ? ` for ${result.email}` : ''}. The first digest lands on Tuesday — new companies, raises and roles across the region.`}
          action={
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <ButtonLink href="/">Browse the gallery</ButtonLink>
              <ButtonLink href="/news" variant="secondary">
                Read the news
              </ButtonLink>
            </div>
          }
        />
      ) : (
        <EmptyState
          icon="circle-alert"
          title="That link has expired"
          message="Confirmation links work once. Put your address in again and we will send a fresh one."
          action={
            <ButtonLink href="/newsletter" style={{ marginTop: 'var(--space-2)' }}>
              Subscribe again
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
