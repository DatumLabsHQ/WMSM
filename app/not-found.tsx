import { ButtonLink } from '@/components/ds/Button';
import { EmptyState } from '@/components/ds/EmptyState';
import { Wordmark } from '@/components/Wordmark';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          minHeight: 'var(--header-h)',
          background: 'var(--surface-inverse)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-6)',
        }}
      >
        <Wordmark />
      </header>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 'var(--space-8)' }}>
        <EmptyState
          icon="compass"
          title="Nothing at this address"
          message="The page has moved or never existed. The map is the best place to start."
          action={
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <ButtonLink href="/map">Open the map</ButtonLink>
              <ButtonLink href="/" variant="secondary">
                Home
              </ButtonLink>
            </div>
          }
        />
      </div>
    </div>
  );
}
