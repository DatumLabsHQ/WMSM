'use client';

import { useState } from 'react';
import { Button } from '@/components/ds/Button';
import { Card } from '@/components/ds/Card';
import { Icon } from '@/components/ds/Icon';

/**
 * The careers-page widget, offered on the company's own profile. Every install is
 * a real anchor back to us from a company site — which is worth more than any
 * amount of on-page optimisation.
 */
export function EmbedSnippet({ slug, name, origin }: { slug: string; name: string; origin: string }) {
  const [copied, setCopied] = useState(false);

  const snippet = `<div data-wmsm-jobs data-company="${slug}"></div>
<script src="${origin}/embed/jobs.js" async></script>`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked — the code is on screen and selectable anyway.
    }
  };

  return (
    <Card padding="var(--space-5)" elevation="hairline">
      <span className="wm-label">Put these roles on your own site</span>
      <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', margin: '10px 0 12px' }}>
        Two lines on {name}&rsquo;s careers page and your roles appear there, updating themselves. No tracking, no account.
      </p>
      <pre
        style={{
          font: 'var(--weight-regular) 12px/1.6 var(--font-mono)',
          background: 'var(--surface-sunken)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          overflowX: 'auto',
          margin: '0 0 var(--space-3)',
          color: 'var(--ink-700)',
        }}
      >
        <code>{snippet}</code>
      </pre>
      <Button size="sm" variant="secondary" onClick={copy} iconLeft={<Icon name={copied ? 'check' : 'layers'} size={14} />}>
        {copied ? 'Copied' : 'Copy the snippet'}
      </Button>
    </Card>
  );
}
