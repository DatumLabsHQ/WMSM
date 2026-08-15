import 'server-only';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

/**
 * Every public write is rate limited. It is stored in the database rather than in
 * memory because serverless instances do not share memory, and a limiter that
 * resets on every cold start is decoration rather than protection.
 */

export async function clientKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  return (forwarded?.split(',')[0] ?? h.get('x-real-ip') ?? 'unknown').trim();
}

export async function rateLimit(action: string, identifier: string, limit: number, windowSeconds: number): Promise<boolean> {
  const key = `${action}:${identifier}`;
  const now = new Date();

  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.expiresAt < now) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, expiresAt: new Date(now.getTime() + windowSeconds * 1000) },
      update: { count: 1, expiresAt: new Date(now.getTime() + windowSeconds * 1000) },
    });
    return true;
  }

  if (existing.count >= limit) return false;

  await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}

/** Housekeeping, called from the cron route so the table cannot grow forever. */
export async function purgeExpiredLimits(): Promise<number> {
  const { count } = await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return count;
}
