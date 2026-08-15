import 'server-only';

/**
 * Transport contract.
 *
 * Nothing in the app calls a provider directly — everything goes through
 * `lib/email/send.ts`, which writes the message to the outbox first and only then
 * hands it to whichever provider `EMAIL_PROVIDER` selects. That means the product
 * works end to end with no credentials at all: messages queue, and you can read
 * exactly what would have been sent in /admin/outbox.
 */

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Set on transactional mail so bulk filters do not sweep it up. */
  category?: string;
  /** One-click unsubscribe, required on anything bulk. */
  listUnsubscribeUrl?: string;
}

export interface SendResult {
  ok: boolean;
  /** The provider's own id, kept so bounces can be traced back to a message. */
  providerId?: string;
  error?: string;
  /** True when no transport is configured and the message stayed queued. */
  skipped?: boolean;
}

export interface EmailProvider {
  name: string;
  send(email: OutgoingEmail): Promise<SendResult>;
}

/** Default. Writes nothing anywhere — the outbox row is the whole record. */
const outboxOnly: EmailProvider = {
  name: 'outbox',
  async send() {
    return { ok: false, skipped: true };
  },
};

/** Dev convenience: dump the message to the server log as well as the outbox. */
const consoleProvider: EmailProvider = {
  name: 'console',
  async send(email) {
    console.log(`\n── email ─────────────────────────────\nto:      ${email.to}\nsubject: ${email.subject}\n\n${email.text}\n──────────────────────────────────────\n`);
    return { ok: true, providerId: `console-${Date.now()}` };
  },
};

/**
 * OnchainSuite transport.
 *
 * PLACEHOLDER CONTRACT — the request shape below is a guess and is almost
 * certainly not what OnchainSuite expects. It is deliberately isolated so that
 * wiring the real API means editing this one function and nothing else.
 *
 * Needed to finish it: the send endpoint, the auth header it wants, the JSON body
 * it accepts, and the field its response returns the message id in.
 */
const onchainSuite: EmailProvider = {
  name: 'onchainsuite',
  async send(email) {
    const url = process.env.ONCHAINSUITE_API_URL;
    const key = process.env.ONCHAINSUITE_API_KEY;
    if (!url || !key) return { ok: false, skipped: true, error: 'ONCHAINSUITE_API_URL or ONCHAINSUITE_API_KEY not set' };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM ?? 'West Midlands Startup Map <hello@westmidlandsstartupmap.com>',
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          category: email.category,
          headers: email.listUnsubscribeUrl
            ? {
                'List-Unsubscribe': `<${email.listUnsubscribeUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              }
            : undefined,
        }),
      });

      if (!res.ok) return { ok: false, error: `${res.status} ${(await res.text()).slice(0, 300)}` };
      const body = (await res.json().catch(() => ({}))) as { id?: string; messageId?: string };
      return { ok: true, providerId: body.id ?? body.messageId };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'network error' };
    }
  },
};

const PROVIDERS: Record<string, EmailProvider> = {
  outbox: outboxOnly,
  console: consoleProvider,
  onchainsuite: onchainSuite,
};

export function emailProvider(): EmailProvider {
  return PROVIDERS[process.env.EMAIL_PROVIDER ?? 'outbox'] ?? outboxOnly;
}
