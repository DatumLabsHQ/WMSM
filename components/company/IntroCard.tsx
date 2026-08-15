'use client';

import { useActionState, useState } from 'react';
import { requestIntro, type ActionResult } from '@/app/actions';
import { Button } from '@/components/ds/Button';
import { Card } from '@/components/ds/Card';
import { Dialog } from '@/components/ds/Dialog';
import { Icon } from '@/components/ds/Icon';
import { Input, Textarea } from '@/components/ds/Input';

export function IntroCard({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(requestIntro, null);

  return (
    <Card padding="var(--space-5)">
      <span className="wm-label">Get an intro</span>
      <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', margin: '8px 0 12px' }}>
        We pass introductions on by hand. Tell us why you want to meet {name} and we will forward it.
      </p>
      <Button
        size="sm"
        variant="accent"
        fullWidth
        onClick={() => setOpen(true)}
        iconLeft={<Icon name="handshake" size={15} color="#fff" />}
      >
        Request an intro
      </Button>

      <Dialog
        open={open}
        title={`Request an intro to ${name}`}
        description="No template emails. A line about what you want from the conversation gets a much better hit rate."
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="intro-form" disabled={pending}>
              {pending ? 'Sending…' : 'Send request'}
            </Button>
          </>
        }
      >
        <form id="intro-form" action={action} style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <input
            type="text"
            name="website_url"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
          />
          <input type="hidden" name="slug" value={slug} />
          <Input name="name" required aria-label="Your name" placeholder="Your name" />
          <Input name="email" type="email" required aria-label="Your email address" placeholder="you@email.com" />
          <Textarea name="reason" required aria-label="Why you want the introduction" placeholder="What are you hoping to talk about?" />
          {state ? (
            <p
              style={{ font: 'var(--type-body-sm)', color: state.ok ? 'var(--status-success)' : 'var(--status-danger)', margin: 0 }}
              role="status"
            >
              {state.message}
            </p>
          ) : null}
        </form>
      </Dialog>
    </Card>
  );
}
