import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ds/Button';
import { EmptyState } from '@/components/ds/EmptyState';
import { prisma } from '@/lib/db';
import { enqueueEmail } from '@/lib/email/send';
import { siteUrl } from '@/lib/email/templates';
import * as tpl from '@/lib/email/templates';

export const metadata: Metadata = { title: 'Verify your claim', robots: { index: false } };
export const dynamic = 'force-dynamic';

/**
 * Completing this link is what actually marks a listing claimed and verified.
 * It is single-use: the token is consumed, and any other pending claims on the
 * same company are closed so a second person cannot follow an old link in.
 */
async function verify(token: string) {
  const claim = await prisma.claimRequest.findUnique({ where: { token } });
  if (!claim || claim.status !== 'pending') return { ok: false as const, reason: 'used' as const };
  if (claim.expiresAt < new Date()) {
    await prisma.claimRequest.update({ where: { id: claim.id }, data: { status: 'expired' } });
    return { ok: false as const, reason: 'expired' as const };
  }

  const company = await prisma.company.findUnique({ where: { id: claim.companyId }, select: { name: true, slug: true } });
  if (!company) return { ok: false as const, reason: 'gone' as const };

  await prisma.$transaction([
    prisma.claimRequest.update({ where: { id: claim.id }, data: { status: 'verified', verifiedAt: new Date() } }),
    prisma.claimRequest.updateMany({
      where: { companyId: claim.companyId, status: 'pending', NOT: { id: claim.id } },
      data: { status: 'rejected' },
    }),
    prisma.company.update({ where: { id: claim.companyId }, data: { claimed: true, verified: true } }),
  ]);

  await enqueueEmail({
    to: claim.email,
    template: 'claim-verified',
    payload: { companySlug: company.slug },
    rendered: tpl.claimVerified({ companyName: company.name, companyUrl: `${siteUrl()}/company/${company.slug}` }),
  });

  return { ok: true as const, company };
}

export default async function ClaimVerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const result = token ? await verify(token) : { ok: false as const, reason: 'used' as const };

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: 'var(--space-24) var(--space-6)' }}>
      {result.ok ? (
        <EmptyState
          icon="circle-check"
          title={`${result.company.name} is yours`}
          message="The listing now shows as verified. Send us roles, a round or a correction any time — all free."
          action={
            <ButtonLink href={`/company/${result.company.slug}`} style={{ marginTop: 'var(--space-2)' }}>
              See the listing
            </ButtonLink>
          }
        />
      ) : (
        <EmptyState
          icon="circle-alert"
          title={result.reason === 'expired' ? 'That link has expired' : 'That link has already been used'}
          message="Claim links work once and last 48 hours. Open the listing and start the claim again — it takes a moment."
          action={
            <ButtonLink href="/" variant="secondary" style={{ marginTop: 'var(--space-2)' }}>
              Find the listing
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
