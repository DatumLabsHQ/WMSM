'use client';

import { useActionState } from 'react';
import { runPastedImport, type ImportState } from '@/app/admin/candidates/actions';
import { Button } from '@/components/ds/Button';
import { Card } from '@/components/ds/Card';
import { Input, Textarea } from '@/components/ds/Input';

export function PasteImporter() {
  const [state, action, pending] = useActionState<ImportState | null, FormData>(runPastedImport, null);

  return (
    <Card padding="var(--space-5)" elevation="hairline">
      <h2 style={{ font: 'var(--type-h2)', marginBottom: 8 }}>Paste a list</h2>
      <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)' }}>
        The best sources are not APIs — they are investor portfolio pages, accelerator cohorts, Silicon Canal, tenant lists at Alpha
        Works and Innovation Birmingham, TIGA members for Silicon Spa. One company per line, separated by commas, tabs or pipes:
      </p>
      <pre
        style={{
          font: 'var(--weight-regular) 12px/1.6 var(--font-mono)',
          background: 'var(--surface-sunken)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          margin: '0 0 var(--space-4)',
          overflowX: 'auto',
          color: 'var(--ink-700)',
        }}
      >
        <code>{`Kanda Robotics, kandarobotics.co.uk, B11 2AA
Ledgerly, ledgerly.io, B3 2QD, Series A`}</code>
      </pre>

      <form action={action} style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <Textarea name="list" rows={8} placeholder="Name, website, postcode, note" aria-label="Companies to import" />
        <Input name="note" placeholder="Where this list came from — e.g. Midven portfolio, Aug 2026" aria-label="Source note" />
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button type="submit" disabled={pending}>
            {pending ? 'Importing…' : 'Import as candidates'}
          </Button>
          <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
            Nothing goes live — everything lands in the queue below.
          </span>
        </div>
        {state ? (
          <p
            role="status"
            style={{
              font: 'var(--type-body-sm)',
              color: state.ok ? 'var(--status-success)' : 'var(--status-danger)',
              margin: 0,
              whiteSpace: 'pre-line',
            }}
          >
            {state.message}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
