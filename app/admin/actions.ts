'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { isAdmin, signIn, signOut } from '@/lib/admin-auth';
import { enqueueEmail, retryMessage } from '@/lib/email/send';
import { siteUrl } from '@/lib/email/templates';
import * as tpl from '@/lib/email/templates';
import { readingMinutes, slugify } from '@/lib/markdown';
import { runDigest } from '@/lib/digest';
import { backfillGeocodes, geocodeCompany, geocodePostcode } from '@/lib/geocode';
import { backfillLogos, resolveLogo } from '@/lib/logos';
import { draftFundingPosts } from '@/lib/autodraft';
import { takeSnapshots } from '@/lib/snapshots';

async function guard() {
  if (!(await isAdmin())) throw new Error('Not authorised');
}

export async function login(_prev: { error?: string } | null, data: FormData) {
  const ok = await signIn(String(data.get('token') ?? ''));
  if (!ok) return { error: 'Wrong token.' };
  redirect('/admin');
}

export async function logout() {
  await signOut();
  redirect('/admin');
}

/* ------------------------------------------------------------- submissions --- */

/**
 * Approving a submission creates the listing: the postcode is resolved through
 * postcodes.io so the pin, locality and authority are right immediately, and we
 * make one attempt at finding the company's own logo. If the postcode will not
 * resolve — or sits outside the region — the listing still goes live on the
 * region centre with `geocodedAt` unset, so the backfill can pick it up.
 */
export async function approveSubmission(formData: FormData) {
  await guard();
  const id = String(formData.get('id'));

  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission || submission.status !== 'pending') return;

  const slug = slugify(submission.name);
  const clash = await prisma.company.findUnique({ where: { slug } });

  // Resolve the postcode before writing, so the pin is right the first time.
  const point = await geocodePostcode(submission.postcode);

  const company = await prisma.company.create({
    data: {
      slug: clash ? `${slug}-${submission.id.slice(0, 4)}` : slug,
      name: submission.name,
      blurb: submission.blurb,
      sectorId: submission.sectorId,
      stage: submission.stage,
      headcount: '1–10',
      locality: point?.locality ?? submission.postcode.split(' ')[0],
      postcode: point?.postcode ?? submission.postcode,
      authority: point?.authority ?? 'Birmingham',
      lat: point?.lat ?? 52.4797,
      lng: point?.lng ?? -1.9026,
      geocodedAt: point ? new Date() : null,
      founded: new Date().getUTCFullYear(),
      website: submission.website,
      status: 'published',
    },
    select: { id: true, slug: true },
  });

  // Best effort — a missing logo is not a reason to hold up a listing.
  await resolveLogo(company.id).catch(() => false);

  await prisma.submission.update({
    where: { id },
    data: { status: 'approved', reviewedAt: new Date(), companyId: company.slug },
  });

  await enqueueEmail({
    to: submission.contactEmail,
    template: 'submission-approved',
    payload: { slug: company.slug },
    rendered: tpl.submissionApproved({ name: submission.name, companyUrl: `${siteUrl()}/company/${company.slug}` }),
  });

  revalidatePath('/admin');
  revalidatePath('/');
}

export async function rejectSubmission(formData: FormData) {
  await guard();
  const id = String(formData.get('id'));
  const reason = String(formData.get('reason') ?? '').trim() || 'It does not look like a company operating in the region yet.';

  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission || submission.status !== 'pending') return;

  await prisma.submission.update({ where: { id }, data: { status: 'rejected', note: reason, reviewedAt: new Date() } });

  await enqueueEmail({
    to: submission.contactEmail,
    template: 'submission-rejected',
    payload: { id },
    rendered: tpl.submissionRejected({ name: submission.name, reason }),
  });

  revalidatePath('/admin');
}

/* ---------------------------------------------------------------- articles --- */

export async function saveArticle(formData: FormData) {
  await guard();

  const id = String(formData.get('id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '');
  const excerpt = String(formData.get('excerpt') ?? '').trim();
  const kind = String(formData.get('kind') ?? 'story');
  const status = String(formData.get('status') ?? 'draft');
  const companySlug = String(formData.get('companySlug') ?? '').trim();
  const tagSlugs = String(formData.get('tags') ?? '')
    .split(',')
    .map((t) => slugify(t))
    .filter(Boolean);
  const publishedAtRaw = String(formData.get('publishedAt') ?? '').trim();

  if (!title || !body) return;

  const company = companySlug ? await prisma.company.findUnique({ where: { slug: companySlug }, select: { id: true } }) : null;

  const tagIds: string[] = [];
  for (const slug of tagSlugs) {
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { slug, label: slug.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) },
      select: { id: true },
    });
    tagIds.push(tag.id);
  }

  const data = {
    title,
    excerpt,
    body,
    kind,
    status,
    // Publishing without an explicit date means "now"; a future date schedules it.
    publishedAt: publishedAtRaw ? new Date(publishedAtRaw) : status === 'published' ? new Date() : null,
    readMinutes: readingMinutes(body),
    companyId: company?.id ?? null,
  };

  const article = id
    ? await prisma.article.update({ where: { id }, data, select: { id: true, slug: true } })
    : await prisma.article.create({
        data: { ...data, slug: slugify(title) || `post-${Date.now()}` },
        select: { id: true, slug: true },
      });

  await prisma.articleTag.deleteMany({ where: { articleId: article.id } });
  if (tagIds.length) {
    await prisma.articleTag.createMany({ data: tagIds.map((tagId) => ({ articleId: article.id, tagId })) });
  }

  revalidatePath('/news');
  revalidatePath(`/news/${article.slug}`);
  redirect('/admin/articles');
}

export async function deleteArticle(formData: FormData) {
  await guard();
  await prisma.article.delete({ where: { id: String(formData.get('id')) } });
  revalidatePath('/news');
  revalidatePath('/admin/articles');
}

/* ------------------------------------------------------------------- email --- */

export async function retryEmail(formData: FormData) {
  await guard();
  await retryMessage(String(formData.get('id')));
  revalidatePath('/admin/outbox');
}

export async function sendDigest() {
  await guard();
  await runDigest();
  revalidatePath('/admin/outbox');
}

/* ----------------------------------------------------------- maintenance --- */

export async function runGeocodeBackfill() {
  await guard();
  await backfillGeocodes(50);
  revalidatePath('/admin/companies');
  revalidatePath('/map');
}

export async function runLogoBackfill() {
  await guard();
  await backfillLogos(30);
  revalidatePath('/admin/companies');
  revalidatePath('/');
}

export async function runDraftFundingPosts() {
  await guard();
  await draftFundingPosts(30);
  revalidatePath('/admin/articles');
}

export async function runSnapshots() {
  await guard();
  await takeSnapshots();
  revalidatePath('/admin');
}

/** Per-company overrides from the companies table. */
export async function setCompanyLogo(formData: FormData) {
  await guard();
  const id = String(formData.get('id'));
  const logoUrl = String(formData.get('logoUrl') ?? '').trim();
  await prisma.company.update({ where: { id }, data: { logoUrl: logoUrl || null } });
  revalidatePath('/admin/companies');
  revalidatePath('/');
}

export async function findCompanyLogo(formData: FormData) {
  await guard();
  await resolveLogo(String(formData.get('id')));
  revalidatePath('/admin/companies');
}

export async function fixCompanyLocation(formData: FormData) {
  await guard();
  await geocodeCompany(String(formData.get('id')));
  revalidatePath('/admin/companies');
  revalidatePath('/map');
}
