'use client';

import { useActionState } from 'react';
import { subscribe, type ActionResult } from '@/app/actions';
import { Button } from '@/components/ds/Button';
import { Card } from '@/components/ds/Card';
import { Checkbox } from '@/components/ds/Checkbox';
import { Input } from '@/components/ds/Input';

const TOPICS = [
  { value: 'weekly', label: 'The weekly digest', hint: 'Everything, once a week' },
  { value: 'funding', label: 'Funding alerts', hint: 'When a listed company raises' },
  { value: 'jobs', label: 'New roles near me', hint: 'Needs a postcode' },
];

/** The full-page signup, with topics. The compact one lives in DigestSignup. */
export function NewsletterForm({ companies, roles }: { companies: number; roles: number }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(subscribe, null);

  return (
    <Card padding="var(--space-6)" elevation="hairline">
      <form action={action} style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <input type="hidden" name="source" value="newsletter" />
        {/* Honeypot. Hidden from people, irresistible to bots. */}
        <input
          type="text"
          name="website_url"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="wm-label">Email</span>
            <Input name="email" type="email" required placeholder="you@email.com" />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="wm-label">Postcode (optional)</span>
            <Input name="postcode" placeholder="B3 2TA" />
          </label>
        </div>

        <div>
          <span className="wm-label">Send me</span>
          <div style={{ marginTop: 6 }}>
            {TOPICS.map((t) => (
              <Checkbox
                key={t.value}
                name="topics"
                value={t.value}
                defaultChecked
                label={t.label}
                wrapStyle={{ alignItems: 'flex-start' }}
              />
            ))}
          </div>
          <p className="wm-data" style={{ color: 'var(--text-muted)', margin: '6px 0 0' }}>
            {companies} companies, {roles} roles on the map right now.
          </p>
        </div>

        {state ? (
          <p
            role="status"
            style={{ font: 'var(--type-body-sm)', color: state.ok ? 'var(--status-success)' : 'var(--status-danger)', margin: 0 }}
          >
            {state.message}
          </p>
        ) : null}

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? 'Sending…' : 'Subscribe'}
          </Button>
          <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
            We send a confirmation first. Nothing else until you press it.
          </span>
        </div>
      </form>
    </Card>
  );
}
