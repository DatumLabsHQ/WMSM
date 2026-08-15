import { NextResponse } from 'next/server';
import { runDigest } from '@/lib/digest';
import { purgeExpiredLimits } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

/**
 * Weekly digest job. Point a scheduler at this on Tuesday morning:
 *
 *   Vercel  — add to vercel.json: { "crons": [{ "path": "/api/cron/digest", "schedule": "0 7 * * 2" }] }
 *   Other   — curl -H "authorization: Bearer $CRON_SECRET" https://…/api/cron/digest
 *
 * Guarded by CRON_SECRET. Without one set, the route refuses to run rather than
 * being left open to anyone who guesses the path.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET is not set' }, { status: 503 });
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 });
  }

  const result = await runDigest();
  const purged = await purgeExpiredLimits();

  return NextResponse.json({ ok: true, ...result, purgedRateLimits: purged });
}
