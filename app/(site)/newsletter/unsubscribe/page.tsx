import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ds/Button';
import { EmptyState } from '@/components/ds/EmptyState';
import { unsubscribe } from '@/app/actions';

export const metadata: Metadata = { title: 'Unsubscribe', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const result = token ? await unsubscribe(token) : { ok: false as const };

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: 'var(--space-24) var(--space-6)' }}>
      {result.ok ? (
        <EmptyState
          icon="check"
          title="Unsubscribed"
          message={`${'email' in result && result.email ? result.email : 'That address'} will not hear from us again. No exit survey, no last email.`}
          action={
            <ButtonLink href="/" variant="secondary" style={{ marginTop: 'var(--space-2)' }}>
              Back to the gallery
            </ButtonLink>
          }
        />
      ) : (
        <EmptyState
          icon="circle-alert"
          title="We could not find that subscription"
          message="The link may be from an old address that is already off the list. Nothing more to do either way."
          action={
            <ButtonLink href="/" variant="secondary" style={{ marginTop: 'var(--space-2)' }}>
              Back to the gallery
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
