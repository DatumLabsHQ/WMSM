'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { enqueueEmail, token, unsubscribeUrl } from '@/lib/email/send';
import { siteUrl } from '@/lib/email/templates';
import * as tpl from '@/lib/email/templates';
import { clientKey, rateLimit } from '@/lib/ratelimit';

export interface ActionResult {
  ok: boolean;
  message: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TOO_MANY = 'Too many attempts from this connection. Try again in a few minutes.';

function field(data: FormData, name: string): string {
  return String(data.get(name) ?? '').trim();
}

/** Honeypot: a field no human sees. Bots fill everything. */
function looksLikeABot(data: FormData): boolean {
  return field(data, 'website_url').length > 0;
}

function adminAddress(): string | null {
  return process.env.ADMIN_EMAIL ?? null;
}

/* ------------------------------------------------------------------ claims --- */

/**
 * Claim a listing. The verification link is the proof: only someone who receives
 * mail on the company's own domain can complete it, which is why the address has
 * to match the website we already hold.
 */
export async function claimListing(_prev: ActionResult | null, data: FormData): Promise<ActionResult> {
  if (looksLikeABot(data)) return { ok: true, message: 'Request received.' };

  const slug = field(data, 'slug');
  const email = field(data, 'email').toLowerCase();

  if (!EMAIL.test(email)) return { ok: false, message: 'That email address does not look right.' };
  if (!(await rateLimit('claim', await clientKey(), 5, 3600))) return { ok: false, message: TOO_MANY };

  const company = await prisma.company.findFirst({
    where: { slug, status: 'published' },
    select: { id: true, name: true, website: true },
  });
  if (!company) return { ok: false, message: 'We could not find that listing.' };

  const domain = company.website?.replace(/^https?:\/\//, '').split('/')[0];
  if (domain && !email.endsWith(`@${domain.toLowerCase()}`)) {
    return { ok: false, message: `Use an address on ${domain} so we can check you work there.` };
  }

  const claimToken = token();
  await prisma.claimRequest.create({
    data: {
      companyId: company.id,
      email,
      token: claimToken,
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
    },
  });

  await enqueueEmail({
    to: email,
    template: 'claim-verify',
    payload: { companySlug: slug },
    rendered: tpl.claimVerify({ companyName: company.name, verifyUrl: `${siteUrl()}/claim/verify?token=${claimToken}` }),
  });

  return { ok: true, message: `Check ${email}. The link works once and expires in 48 hours.` };
}

/* ------------------------------------------------------------------ intros --- */

export async function requestIntro(_prev: ActionResult | null, data: FormData): Promise<ActionResult> {
  if (looksLikeABot(data)) return { ok: true, message: 'Sent.' };

  const slug = field(data, 'slug');
  const fromName = field(data, 'name');
  const fromEmail = field(data, 'email').toLowerCase();
  const reason = field(data, 'reason');

  if (fromName.length < 2) return { ok: false, message: 'We need a name to pass on.' };
  if (!EMAIL.test(fromEmail)) return { ok: false, message: 'That email address does not look right.' };
  if (reason.length < 10) return { ok: false, message: 'Say a line or two about why — a bare request gets ignored.' };
  if (!(await rateLimit('intro', await clientKey(), 5, 3600))) return { ok: false, message: TOO_MANY };

  const company = await prisma.company.findFirst({ where: { slug, status: 'published' }, select: { id: true, name: true } });
  if (!company) return { ok: false, message: 'We could not find that listing.' };

  await prisma.introRequest.create({ data: { companyId: company.id, fromName, fromEmail, reason } });

  await enqueueEmail({
    to: fromEmail,
    template: 'intro-acknowledged',
    payload: { companySlug: slug },
    rendered: tpl.introAcknowledged({ companyName: company.name }),
  });

  const admin = adminAddress();
  if (admin) {
    await enqueueEmail({
      to: admin,
      template: 'intro-requested',
      payload: { companySlug: slug, fromEmail },
      rendered: tpl.introRequested({ companyName: company.name, fromName, fromEmail, reason }),
    });
  }

  return { ok: true, message: 'Sent. We pass these on by hand, so it may take a few days.' };
}

/* ------------------------------------------------------------- submissions --- */

export async function submitCompany(_prev: ActionResult | null, data: FormData): Promise<ActionResult> {
  if (looksLikeABot(data)) return { ok: true, message: 'Submitted.' };

  const name = field(data, 'name');
  const website = field(data, 'website');
  const contactName = field(data, 'contactName');
  const contactEmail = field(data, 'contactEmail').toLowerCase();
  const sectorId = field(data, 'sectorId');
  const stage = field(data, 'stage');
  const postcode = field(data, 'postcode');
  const blurb = field(data, 'blurb');

  if (name.length < 2) return { ok: false, message: 'The company needs a name.' };
  if (website.length < 4) return { ok: false, message: 'Add a website so we can check the company exists.' };
  if (contactName.length < 2) return { ok: false, message: 'Tell us who you are.' };
  if (!EMAIL.test(contactEmail)) return { ok: false, message: 'That email address does not look right.' };
  if (!/^[A-Z]{1,2}\d[A-Z\d]?\s?\d?[A-Z]{0,2}$/i.test(postcode)) {
    return { ok: false, message: 'Use a UK postcode, e.g. B3 2TA. We map the listing from it.' };
  }
  if (blurb.length < 10) return { ok: false, message: 'One line on what the company does, please.' };
  if (blurb.length > 140) return { ok: false, message: 'Keep the line under 140 characters — it has to fit on a card.' };
  if (!(await rateLimit('submit', await clientKey(), 5, 3600))) return { ok: false, message: TOO_MANY };

  const sector = await prisma.sector.findUnique({ where: { id: sectorId } });
  if (!sector) return { ok: false, message: 'Pick a sector.' };

  const existing = await prisma.company.findFirst({ where: { name: { equals: name } } });
  if (existing) return { ok: false, message: `${name} is already on the map. Claim the listing instead.` };

  const pending = await prisma.submission.findFirst({ where: { name, status: 'pending' } });
  if (pending) return { ok: false, message: `${name} is already in the queue. We will come back to you.` };

  await prisma.submission.create({
    data: { name, website, contactName, contactEmail, sectorId, stage, postcode: postcode.toUpperCase(), blurb },
  });

  await enqueueEmail({
    to: contactEmail,
    template: 'submission-received',
    payload: { name },
    rendered: tpl.submissionReceived({ name, contactName }),
  });

  revalidatePath('/add');
  return { ok: true, message: 'Submitted. A person reads every one of these; you will hear back within two working days.' };
}

/* -------------------------------------------------------------- newsletter --- */

/**
 * Double opt-in. A pending subscriber is never sent anything except the single
 * confirmation, which is what keeps the list clean and the domain reputable.
 */
export async function subscribe(_prev: ActionResult | null, data: FormData): Promise<ActionResult> {
  if (looksLikeABot(data)) return { ok: true, message: 'Check your inbox to confirm.' };

  const email = field(data, 'email').toLowerCase();
  const postcode = field(data, 'postcode');
  const source = field(data, 'source') || 'site';
  const topics = (data.getAll('topics') as string[]).filter(Boolean);

  if (!EMAIL.test(email)) return { ok: false, message: 'That email address does not look right.' };
  if (!(await rateLimit('subscribe', await clientKey(), 8, 3600))) return { ok: false, message: TOO_MANY };

  const existing = await prisma.subscriber.findUnique({ where: { email } });

  if (existing?.status === 'confirmed') {
    await prisma.subscriber.update({
      where: { email },
      data: { postcode: postcode || existing.postcode, topics: topics.length ? topics.join(',') : existing.topics },
    });
    return { ok: true, message: 'You are already on the list — preferences updated.' };
  }

  const confirmToken = token();
  const subscriber = await prisma.subscriber.upsert({
    where: { email },
    update: {
      postcode: postcode || null,
      source,
      status: 'pending',
      confirmToken,
      topics: topics.length ? topics.join(',') : undefined,
      unsubbedAt: null,
    },
    create: {
      email,
      postcode: postcode || null,
      source,
      status: 'pending',
      confirmToken,
      unsubToken: token(),
      topics: topics.length ? topics.join(',') : 'weekly,funding,jobs',
    },
    select: { id: true },
  });

  await enqueueEmail({
    to: email,
    template: 'confirm-subscription',
    payload: { subscriberId: subscriber.id },
    rendered: tpl.confirmSubscription({ confirmUrl: `${siteUrl()}/newsletter/confirm?token=${confirmToken}` }),
  });

  return { ok: true, message: `Almost there — press the link we just sent to ${email}.` };
}

/** Called by the confirm page. Returns the subscriber's name for the message. */
export async function confirmSubscriber(confirmToken: string): Promise<{ ok: boolean; email?: string }> {
  const subscriber = await prisma.subscriber.findUnique({ where: { confirmToken } });
  if (!subscriber) return { ok: false };

  if (subscriber.status !== 'confirmed') {
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { status: 'confirmed', confirmedAt: new Date(), confirmToken: null },
    });

    const [companies, roles] = await Promise.all([
      prisma.company.count({ where: { status: 'published' } }),
      prisma.job.count({ where: { company: { status: 'published' } } }),
    ]);

    await enqueueEmail({
      to: subscriber.email,
      template: 'welcome',
      payload: { subscriberId: subscriber.id },
      category: 'bulk',
      unsubToken: subscriber.unsubToken,
      rendered: tpl.welcome({ unsubUrl: unsubscribeUrl(subscriber.unsubToken), companies, roles }),
    });
  }

  return { ok: true, email: subscriber.email };
}

export async function unsubscribe(unsubToken: string): Promise<{ ok: boolean; email?: string }> {
  const subscriber = await prisma.subscriber.findUnique({ where: { unsubToken } });
  if (!subscriber) return { ok: false };

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: { status: 'unsubscribed', unsubbedAt: new Date() },
  });

  return { ok: true, email: subscriber.email };
}
