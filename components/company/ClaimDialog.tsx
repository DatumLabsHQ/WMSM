'use client';

import { useActionState, useState } from 'react';
import { claimListing, type ActionResult } from '@/app/actions';
import { Button } from '@/components/ds/Button';
import { Dialog } from '@/components/ds/Dialog';
import { Input } from '@/components/ds/Input';

export function ClaimDialog({ slug, name, website, claimed }: { slug: string; name: string; website: string | null; claimed: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(claimListing, null);

  return (
    <>
      <Button size="sm" variant={claimed ? 'secondary' : 'primary'} onClick={() => setOpen(true)}>
        {claimed ? 'Suggest a correction' : 'Claim this listing'}
      </Button>

      <Dialog
        open={open}
        title={claimed ? 'Suggest a correction' : 'Claim this listing'}
        description={
          claimed
            ? `Someone at ${name} already looks after this listing. Tell us what is wrong and we will pass it on.`
            : `We email the address on your company domain to check you work at ${name}.`
        }
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="claim-form" disabled={pending}>
              {pending ? 'Sending…' : 'Send verification'}
            </Button>
          </>
        }
      >
        <form id="claim-form" action={action} style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <input
            type="text"
            name="website_url"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
          />
          <input type="hidden" name="slug" value={slug} />
          <Input
            name="email"
            type="email"
            required
            aria-label="Your work email address"
            placeholder={website ? `you@${website}` : 'you@company.co.uk'}
          />
          {state ? (
            <p
              style={{
                font: 'var(--type-body-sm)',
                color: state.ok ? 'var(--status-success)' : 'var(--status-danger)',
                margin: 0,
              }}
              role="status"
            >
              {state.message}
            </p>
          ) : null}
        </form>
      </Dialog>
    </>
  );
}
