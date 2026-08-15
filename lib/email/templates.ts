import 'server-only';
import { money, fullDate, plural } from '@/lib/format';

/**
 * Email templates.
 *
 * Plain HTML, tables and inline styles — email clients are not browsers, and the
 * design system's CSS is not available here. The look is a deliberately reduced
 * version of the site: near-white ground, one blue button, near-black type.
 * Every template returns text as well, because a text part is worth real
 * deliverability points and costs almost nothing to write.
 */

const BLUE = '#4A6CF7';
const INK = '#03072D';
const GREY = '#5C6486';
const LINE = '#E1E5EE';

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

function shell(body: string, opts: { preheader?: string; unsubUrl?: string } = {}): string {
  const base = siteUrl();
  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>West Midlands Startup Map</title></head>
<body style="margin:0;padding:0;background:#F5F7FA;">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${opts.preheader}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:14px;border:1px solid ${LINE};">
<tr><td style="padding:28px 28px 0 28px;">
  <a href="${base}" style="text-decoration:none;color:${INK};font:600 15px/1.2 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:-.02em;">
    <span style="display:inline-block;width:24px;height:24px;background:${BLUE};color:#fff;border-radius:7px;text-align:center;line-height:24px;font-size:10px;font-weight:700;">WM</span>
    &nbsp;Startup Map
  </a>
</td></tr>
<tr><td style="padding:20px 28px 28px 28px;font:400 15px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:${INK};">
${body}
</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:18px 8px;font:400 12px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#8D94AC;text-align:center;">
An independent, human-checked map of the region's startups.<br>
${opts.unsubUrl ? `<a href="${opts.unsubUrl}" style="color:#8D94AC;">Unsubscribe</a> · ` : ''}<a href="${base}/method" style="color:#8D94AC;">How we count things</a>
</td></tr></table>
</td></tr></table>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0;"><tr><td style="background:${BLUE};border-radius:999px;">
<a href="${href}" style="display:inline-block;padding:12px 24px;color:#fff;text-decoration:none;font:500 15px/1 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;">${label}</a>
</td></tr></table>`;
}

const p = (text: string) => `<p style="margin:0 0 14px;color:${INK};">${text}</p>`;
const quiet = (text: string) => `<p style="margin:0 0 14px;color:${GREY};font-size:14px;">${text}</p>`;

export interface Rendered {
  subject: string;
  html: string;
  text: string;
}

/* ------------------------------------------------------------- newsletter --- */

export function confirmSubscription(args: { confirmUrl: string }): Rendered {
  return {
    subject: 'Confirm your subscription',
    html: shell(
      `<h1 style="margin:0 0 14px;font:700 22px/1.25 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:-.02em;">One click and you are on the list</h1>
      ${p('We only send to addresses that have confirmed. Press the button and the first email lands on Tuesday.')}
      ${button(args.confirmUrl, 'Confirm subscription')}
      ${quiet('If you did not ask for this, ignore it — nothing is sent until you confirm, and the link expires in seven days.')}`,
      { preheader: 'Confirm your subscription to the weekly digest.' },
    ),
    text: `One click and you are on the list.\n\nConfirm here: ${args.confirmUrl}\n\nIf you did not ask for this, ignore it. Nothing is sent until you confirm.`,
  };
}

export function welcome(args: { unsubUrl: string; companies: number; roles: number }): Rendered {
  const base = siteUrl();
  return {
    subject: 'You are on the list',
    html: shell(
      `<h1 style="margin:0 0 14px;font:700 22px/1.25 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:-.02em;">You are on the list</h1>
      ${p(`Every Tuesday: new companies, raises and roles across the region. Right now that is ${args.companies} companies and ${args.roles} open roles.`)}
      ${button(`${base}/`, 'Browse the gallery')}
      ${quiet('One email a week. Unsubscribe from the bottom of any of them.')}`,
      { preheader: 'The first digest lands on Tuesday.', unsubUrl: args.unsubUrl },
    ),
    text: `You are on the list.\n\nEvery Tuesday: new companies, raises and roles. Right now: ${args.companies} companies, ${args.roles} open roles.\n\n${base}\n\nUnsubscribe: ${args.unsubUrl}`,
  };
}

export interface DigestPayload {
  companies: { name: string; blurb: string; sector: string; location: string; slug: string }[];
  rounds: { companyName: string; amountGbp: number; stage: string; announced: string; companySlug: string }[];
  jobs: { title: string; companyName: string; salaryLabel: string; locality: string; companySlug: string }[];
  articles: { title: string; excerpt: string; slug: string }[];
}

export function digest(args: DigestPayload & { unsubUrl: string; weekOf: Date }): Rendered {
  const base = siteUrl();
  const section = (title: string, rows: string[]) =>
    rows.length
      ? `<p style="margin:24px 0 10px;font:600 12px/1 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#8D94AC;">${title}</p>${rows.join('')}`
      : '';

  const row = (href: string, headline: string, sub: string) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};"><tr><td style="padding:12px 0;">
      <a href="${href}" style="color:${INK};text-decoration:none;font:500 15px/1.35 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;">${headline}</a>
      <div style="color:${GREY};font:400 13px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;margin-top:2px;">${sub}</div>
    </td></tr></table>`;

  const html = shell(
    `<h1 style="margin:0 0 6px;font:700 22px/1.25 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:-.02em;">This week in the West Midlands</h1>
     ${quiet(`Week of ${fullDate(args.weekOf)}`)}
     ${section(
       'Raised',
       args.rounds.map((r) =>
         row(`${base}/company/${r.companySlug}#funding`, `${r.companyName} raised ${money(r.amountGbp)} ${r.stage}`, fullDate(new Date(r.announced))),
       ),
     )}
     ${section('New on the map', args.companies.map((c) => row(`${base}/company/${c.slug}`, c.name, `${c.blurb} · ${c.sector} · ${c.location}`)))}
     ${section('Hiring', args.jobs.map((j) => row(`${base}/company/${j.companySlug}#roles`, j.title, `${j.companyName} · ${j.locality} · ${j.salaryLabel}`)))}
     ${section('Reading', args.articles.map((a) => row(`${base}/news/${a.slug}`, a.title, a.excerpt)))}
     ${button(`${base}/`, 'See everything')}`,
    { preheader: `${plural(args.rounds.length, 'raise')}, ${plural(args.jobs.length, 'role')} and more.`, unsubUrl: args.unsubUrl },
  );

  const text = [
    `This week in the West Midlands — week of ${fullDate(args.weekOf)}`,
    '',
    ...args.rounds.map((r) => `RAISED  ${r.companyName} — ${money(r.amountGbp)} ${r.stage}`),
    ...args.companies.map((c) => `NEW     ${c.name} — ${c.blurb}`),
    ...args.jobs.map((j) => `HIRING  ${j.title} at ${j.companyName} — ${j.salaryLabel}`),
    ...args.articles.map((a) => `READ    ${a.title}`),
    '',
    `${base}`,
    `Unsubscribe: ${args.unsubUrl}`,
  ].join('\n');

  return { subject: `This week: ${plural(args.rounds.length, 'raise')}, ${plural(args.jobs.length, 'new role')}`, html, text };
}

/* ---------------------------------------------------------- transactional --- */

export function claimVerify(args: { companyName: string; verifyUrl: string }): Rendered {
  return {
    subject: `Verify your claim on ${args.companyName}`,
    html: shell(
      `<h1 style="margin:0 0 14px;font:700 22px/1.25 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:-.02em;">Claim ${args.companyName}</h1>
      ${p('This link proves you can receive mail on the company domain, which is all we need to hand you the listing.')}
      ${button(args.verifyUrl, 'Verify and claim')}
      ${quiet('The link works once and expires in 48 hours. If you did not request it, ignore this email and nothing happens.')}`,
      { preheader: `Verify your claim on ${args.companyName}.` },
    ),
    text: `Claim ${args.companyName}\n\nVerify: ${args.verifyUrl}\n\nWorks once, expires in 48 hours.`,
  };
}

export function claimVerified(args: { companyName: string; companyUrl: string }): Rendered {
  return {
    subject: `${args.companyName} is yours`,
    html: shell(
      `<h1 style="margin:0 0 14px;font:700 22px/1.25 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:-.02em;">${args.companyName} is claimed</h1>
      ${p('The listing now shows as verified. Send us corrections, roles or a round any time and they go up free.')}
      ${button(args.companyUrl, 'See the listing')}`,
      { preheader: 'Your listing is verified.' },
    ),
    text: `${args.companyName} is claimed and now shows as verified.\n\n${args.companyUrl}`,
  };
}

export function submissionReceived(args: { name: string; contactName: string }): Rendered {
  return {
    subject: `We have ${args.name}`,
    html: shell(
      `${p(`Thanks ${args.contactName} — ${args.name} is in the queue.`)}
      ${p('A person reads every submission. We check the company exists, works in the region and is not already listed. Expect an answer within two working days.')}
      ${quiet('We store your email to reply to this and nothing else.')}`,
      { preheader: `${args.name} is in the review queue.` },
    ),
    text: `Thanks ${args.contactName} — ${args.name} is in the queue.\n\nA person reads every submission. Expect an answer within two working days.`,
  };
}

export function submissionApproved(args: { name: string; companyUrl: string }): Rendered {
  return {
    subject: `${args.name} is on the map`,
    html: shell(
      `<h1 style="margin:0 0 14px;font:700 22px/1.25 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:-.02em;">${args.name} is live</h1>
      ${p('It is on the map and in the gallery. Claim the listing from its page to post roles and keep it current — both free.')}
      ${button(args.companyUrl, 'See the listing')}`,
      { preheader: `${args.name} is live on the map.` },
    ),
    text: `${args.name} is live.\n\n${args.companyUrl}\n\nClaim the listing from its page to post roles and keep it current.`,
  };
}

export function submissionRejected(args: { name: string; reason: string }): Rendered {
  return {
    subject: `About ${args.name}`,
    html: shell(
      `${p(`We have not listed ${args.name}, and we would rather say why than go quiet.`)}
      ${p(`<strong>${args.reason}</strong>`)}
      ${quiet('If that is wrong, reply and we will look again. We get these wrong sometimes.')}`,
      { preheader: `About your submission for ${args.name}.` },
    ),
    text: `We have not listed ${args.name}.\n\nReason: ${args.reason}\n\nIf that is wrong, reply and we will look again.`,
  };
}

export function introRequested(args: { companyName: string; fromName: string; fromEmail: string; reason: string }): Rendered {
  return {
    subject: `Intro request: ${args.fromName} → ${args.companyName}`,
    html: shell(
      `${p(`<strong>${args.fromName}</strong> (${args.fromEmail}) would like an introduction to <strong>${args.companyName}</strong>.`)}
      ${p(`<em>${args.reason}</em>`)}`,
      { preheader: `${args.fromName} wants an intro to ${args.companyName}.` },
    ),
    text: `${args.fromName} (${args.fromEmail}) would like an introduction to ${args.companyName}.\n\n${args.reason}`,
  };
}

export function introAcknowledged(args: { companyName: string }): Rendered {
  return {
    subject: `Your intro request to ${args.companyName}`,
    html: shell(
      `${p(`We have your request to meet ${args.companyName}.`)}
      ${p('These are passed on by hand, so it takes a few days and it is not guaranteed — the other side has to want the conversation too.')}`,
      { preheader: 'We have your intro request.' },
    ),
    text: `We have your request to meet ${args.companyName}. These are passed on by hand, so it takes a few days and it is not guaranteed.`,
  };
}
