'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
import { geocodePostcode } from '@/lib/geocode';
import { resolveLogo } from '@/lib/logos';
import { importFromGtr } from '@/lib/sources/gtr';
import { importPastedList } from '@/lib/sources/manual';
import { enrichCandidates } from '@/lib/sources/enrich';
import { slugify } from '@/lib/markdown';

async function guard() {
  if (!(await isAdmin())) throw new Error('Not authorised');
}

export interface ImportState {
  ok: boolean;
  message: string;
}

/**
 * Accepting is the moment a candidate becomes public, so it does the full job:
 * resolve the postcode, look for a logo, publish. Anything the importer could not
 * know — headcount, the one-line description — starts honest and gets corrected.
 */
export async function acceptCandidate(formData: FormData) {
  await guard();

  const id = String(formData.get('id'));
  const sectorId = String(formData.get('sectorId') ?? '').trim();
  const blurb = String(formData.get('blurb') ?? '').trim();
  const stage = String(formData.get('stage') ?? 'Seed');

  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate || candidate.status !== 'new') return;
  if (!sectorId) return;

  const point = await geocodePostcode(candidate.postcode);
  const base = slugify(candidate.name);
  const clash = await prisma.company.findUnique({ where: { slug: base } });

  const company = await prisma.company.create({
    data: {
      slug: clash ? `${base}-${candidate.id.slice(0, 4)}` : base,
      name: candidate.name,
      blurb: blurb || candidate.note.split('·')[0]?.trim() || 'No description yet',
      sectorId,
      stage,
      headcount: '1–10',
      locality: point?.locality ?? candidate.locality ?? candidate.postcode.split(' ')[0],
      postcode: point?.postcode ?? candidate.postcode,
      authority: point?.authority ?? 'Birmingham',
      lat: point?.lat ?? 52.4797,
      lng: point?.lng ?? -1.9026,
      geocodedAt: point ? new Date() : null,
      founded: candidate.incorporated?.getUTCFullYear() ?? new Date().getUTCFullYear(),
      website: candidate.website,
      // Imported, not checked by a person beyond this click — so not verified.
      verified: false,
      status: 'published',
    },
    select: { id: true, slug: true },
  });

  await resolveLogo(company.id).catch(() => false);

  await prisma.candidate.update({
    where: { id },
    data: { status: 'accepted', reviewedAt: new Date(), companyId: company.id },
  });

  revalidatePath('/admin/candidates');
  revalidatePath('/');
}

export async function rejectCandidate(formData: FormData) {
  await guard();
  const id = String(formData.get('id'));
  await prisma.candidate.update({
    where: { id },
    data: { status: String(formData.get('as') ?? 'rejected'), reviewedAt: new Date() },
  });
  revalidatePath('/admin/candidates');
}

/** Bulk-clear everything below a score, so the queue is workable. */
export async function rejectBelowScore(formData: FormData) {
  await guard();
  const threshold = Number(formData.get('threshold') ?? 40);
  await prisma.candidate.updateMany({
    where: { status: 'new', score: { lt: threshold } },
    data: { status: 'rejected', reviewedAt: new Date() },
  });
  revalidatePath('/admin/candidates');
}

/** Reads each candidate's own website so a reviewer edits a line instead of writing one. */
export async function runEnrichment(): Promise<void> {
  await guard();
  await enrichCandidates(60);
  revalidatePath('/admin/candidates');
}

export async function runGtrImport(): Promise<void> {
  await guard();
  await importFromGtr();
  revalidatePath('/admin/candidates');
}

export async function runPastedImport(_prev: ImportState | null, formData: FormData): Promise<ImportState> {
  await guard();

  const text = String(formData.get('list') ?? '');
  const note = String(formData.get('note') ?? '').trim();
  if (!text.trim()) return { ok: false, message: 'Nothing pasted.' };

  const result = await importPastedList(text, note);
  revalidatePath('/admin/candidates');

  const problems = result.problems.slice(0, 5).map((p) => `“${p.line.slice(0, 40)}” — ${p.reason}`);
  return {
    ok: true,
    message: [
      `${result.created} new, ${result.updated} updated, ${result.skipped} already handled, from ${result.scanned} lines.`,
      result.problems.length ? `${result.problems.length} could not be read:` : '',
      ...problems,
    ]
      .filter(Boolean)
      .join('\n'),
  };
}
