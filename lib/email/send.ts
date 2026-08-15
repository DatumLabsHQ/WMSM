import 'server-only';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { emailProvider, type OutgoingEmail } from './provider';
import type { Rendered } from './templates';
import { siteUrl } from './templates';

/**
 * The one way mail leaves this application.
 *
 * Write to the outbox, then try to send. If there is no provider configured, or
 * the provider fails, the row stays `queued`/`failed` with the full rendered body
 * on it — so nothing is ever silently lost and everything can be retried from
 * /admin/outbox once the transport is wired up.
 */

export function token(bytes = 24): string {
  return randomBytes(bytes).toString('base64url');
}

export function unsubscribeUrl(unsubToken: string): string {
  return `${siteUrl()}/newsletter/unsubscribe?token=${unsubToken}`;
}

interface EnqueueArgs {
  to: string;
  template: string;
  rendered: Rendered;
  payload?: Record<string, unknown>;
  category?: 'transactional' | 'bulk';
  unsubToken?: string;
  batch?: string;
}

export async function enqueueEmail(args: EnqueueArgs): Promise<{ id: string; sent: boolean }> {
  const message = await prisma.emailMessage.create({
    data: {
      to: args.to.toLowerCase(),
      subject: args.rendered.subject,
      template: args.template,
      payload: JSON.stringify(args.payload ?? {}),
      html: args.rendered.html,
      text: args.rendered.text,
      batch: args.batch ?? null,
      status: 'queued',
    },
    select: { id: true },
  });

  const sent = await attemptSend(message.id, {
    to: args.to,
    subject: args.rendered.subject,
    html: args.rendered.html,
    text: args.rendered.text,
    category: args.category ?? 'transactional',
    listUnsubscribeUrl: args.unsubToken ? unsubscribeUrl(args.unsubToken) : undefined,
  });

  return { id: message.id, sent };
}

/** Shared by the initial attempt and by the retry button in /admin. */
export async function attemptSend(messageId: string, email: OutgoingEmail): Promise<boolean> {
  const provider = emailProvider();
  const result = await provider.send(email);

  await prisma.emailMessage.update({
    where: { id: messageId },
    data: {
      attempts: { increment: 1 },
      provider: provider.name,
      status: result.ok ? 'sent' : result.skipped ? 'queued' : 'failed',
      providerId: result.providerId ?? null,
      error: result.error ?? null,
      sentAt: result.ok ? new Date() : null,
    },
  });

  return result.ok;
}

export async function retryMessage(messageId: string): Promise<boolean> {
  const m = await prisma.emailMessage.findUnique({ where: { id: messageId } });
  if (!m) return false;
  return attemptSend(m.id, { to: m.to, subject: m.subject, html: m.html, text: m.text });
}
