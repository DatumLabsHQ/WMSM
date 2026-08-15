import { NextResponse } from 'next/server';
import { takeSnapshots } from '@/lib/snapshots';
import { draftFundingPosts } from '@/lib/autodraft';
import { backfillGeocodes } from '@/lib/geocode';
import { backfillLogos } from '@/lib/logos';
import { purgeExpiredLimits } from '@/lib/ratelimit';
import { enrichCandidates } from '@/lib/sources/enrich';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * The daily housekeeping run. Everything here is idempotent and safe to repeat.
 *
 *   Vercel — vercel.json: { "crons": [{ "path": "/api/cron/daily", "schedule": "0 5 * * *" }] }
 *   Other  — curl -H "authorization: Bearer $CRON_SECRET" https://…/api/cron/daily
 *
 * Note it drafts funding posts but never publishes one. A person reads every piece
 * before it goes out; the job only removes the blank page.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: 'CRON_SECRET is not set' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 });
  }

  const [snapshots, drafts, geocoded, logos, purged, enriched] = await Promise.all([
    takeSnapshots(),
    draftFundingPosts(),
    backfillGeocodes(),
    backfillLogos(),
    purgeExpiredLimits(),
    enrichCandidates(60),
  ]);

  return NextResponse.json({
    ok: true,
    snapshots: snapshots.written,
    draftsCreated: drafts.created,
    draftSlugs: drafts.slugs,
    geocoded,
    logos,
    purgedRateLimits: purged,
    enriched,
  });
}
