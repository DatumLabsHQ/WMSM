'use client';

import { useActionState } from 'react';
import { login } from '@/app/admin/actions';
import { Button } from '@/components/ds/Button';
import { Card } from '@/components/ds/Card';
import { Input } from '@/components/ds/Input';

export function AdminLogin() {
  const [state, action, pending] = useActionState<{ error?: string } | null, FormData>(login, null);

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 'var(--space-24) var(--space-6)' }}>
      <Card padding="var(--space-6)" elevation="hairline">
        <h1 style={{ font: 'var(--type-h2)', marginBottom: 'var(--space-2)' }}>Admin</h1>
        <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)' }}>
          One shared token. Not an account system — a lock on the review queue.
        </p>
        <form action={action} style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <Input name="token" type="password" required autoFocus aria-label="Admin token" placeholder="Admin token" />
          {state?.error ? (
            <p role="alert" style={{ font: 'var(--type-body-sm)', color: 'var(--status-danger)', margin: 0 }}>
              {state.error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} fullWidth>
            {pending ? 'Checking…' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
