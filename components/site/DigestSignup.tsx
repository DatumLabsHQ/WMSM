'use client';

import { useActionState } from 'react';
import { subscribe, type ActionResult } from '@/app/actions';
import { Button } from '@/components/ds/Button';
import { Card } from '@/components/ds/Card';
import { Icon } from '@/components/ds/Icon';
import { Input } from '@/components/ds/Input';

/** One email a week. Postcode is optional and only used to filter the list. */
export function DigestSignup({ source = 'site', compact = false }: { source?: string; compact?: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(subscribe, null);

  return (
    <Card padding="var(--space-6)" elevation="none" style={{ background: 'var(--surface-inverse)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: compact ? 'flex-start' : 'center',
          gap: 'var(--space-5)',
          flexDirection: compact ? 'column' : 'row',
          flexWrap: 'wrap',
        }}
      >
        <Icon name="mail" size={22} color="var(--copper-500)" />
        <div style={{ flex: 1, minWidth: 220 }}>
          <h3 style={{ font: 'var(--type-h3)', color: 'var(--paper-100)' }}>Roles near you, every Tuesday</h3>
          <p style={{ font: 'var(--type-body-sm)', color: 'var(--ink-300)', margin: '4px 0 0' }}>
            One email. New roles and raises within 15 miles, from companies we have checked.
          </p>
        </div>
        <form action={action} style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            name="website_url"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
          />
          <input type="hidden" name="source" value={source} />
          <div style={{ width: 210 }}>
            <Input name="email" type="email" required inverse aria-label="Your email address" placeholder="you@email.com" />
          </div>
          <div style={{ width: 120 }}>
            <Input name="postcode" inverse aria-label="Your postcode (optional)" placeholder="B3 2TA" />
          </div>
          <Button type="submit" variant="inverse" disabled={pending}>
            {pending ? 'Adding…' : 'Subscribe'}
          </Button>
        </form>
      </div>
      {state ? (
        <p
          role="status"
          style={{ font: 'var(--type-body-sm)', color: state.ok ? 'var(--moss-500)' : 'var(--brick-500)', margin: 'var(--space-4) 0 0' }}
        >
          {state.message}
        </p>
      ) : null}
    </Card>
  );
}
