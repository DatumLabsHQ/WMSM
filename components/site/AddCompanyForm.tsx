'use client';

import { useActionState } from 'react';
import { submitCompany, type ActionResult } from '@/app/actions';
import { Button } from '@/components/ds/Button';
import { Card } from '@/components/ds/Card';
import { EmptyState } from '@/components/ds/EmptyState';
import { Input, Textarea } from '@/components/ds/Input';
import { Select } from '@/components/ds/Select';
import type { SectorView } from '@/lib/queries';

const STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Bootstrapped'];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span className="wm-label">{label}</span>
      {children}
      {hint ? (
        <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function AddCompanyForm({ sectors }: { sectors: SectorView[] }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(submitCompany, null);

  if (state?.ok) {
    return (
      <Card padding="var(--space-8)">
        <EmptyState
          icon="circle-check"
          title="Submitted"
          message={state.message}
          action={
            <p className="wm-data" style={{ color: 'var(--text-muted)', margin: 0 }}>
              Nothing appears on the map until a person has read it.
            </p>
          }
        />
      </Card>
    );
  }

  return (
    <Card padding="var(--space-6)">
      <form action={action} style={{ display: 'grid', gap: 'var(--space-5)' }}>
          <input
            type="text"
            name="website_url"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
          />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
          <Field label="Company name">
            <Input name="name" required maxLength={80} placeholder="Kanda Robotics" />
          </Field>
          <Field label="Website" hint="No https:// needed. We check the domain before verifying you.">
            <Input name="website" required maxLength={120} placeholder="kandarobotics.co.uk" />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
          <Field label="Sector">
            <Select name="sectorId" required options={sectors.map((s) => ({ value: s.id, label: s.label }))} defaultValue="" />
          </Field>
          <Field label="Stage">
            <Select name="stage" required options={STAGES} defaultValue="Pre-seed" />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
          <Field label="Postcode" hint="Where the company actually works. We map the pin from this.">
            <Input name="postcode" required maxLength={8} placeholder="B3 2TA" />
          </Field>
          <Field label="One line on what you do" hint="Under 140 characters. It has to fit on a card.">
            <Input name="blurb" required maxLength={140} placeholder="Pick-and-place cells for SME manufacturers" />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
          <Field label="Your name">
            <Input name="contactName" required maxLength={80} placeholder="A. Reeves" />
          </Field>
          <Field label="Your work email" hint="We reply here. It is not published.">
            <Input name="contactEmail" type="email" required placeholder="you@yourcompany.co.uk" />
          </Field>
        </div>

        {state && !state.ok ? (
          <p role="alert" style={{ font: 'var(--type-body-sm)', color: 'var(--status-danger)', margin: 0 }}>
            {state.message}
          </p>
        ) : null}

        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? 'Submitting…' : 'Submit for review'}
          </Button>
          <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
            Free. No plan, no card.
          </span>
        </div>
      </form>
    </Card>
  );
}
