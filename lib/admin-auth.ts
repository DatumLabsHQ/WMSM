import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Deliberately small. One shared token in the environment, hashed into a cookie,
 * compared in constant time. It is not a user system — it is a lock on the review
 * queue until there is a reason to build accounts.
 */
const COOKIE = 'wm_admin';

function secret(): string | null {
  return process.env.ADMIN_TOKEN || null;
}

function stamp(tokenValue: string): string {
  return createHmac('sha256', tokenValue).update('wm-admin-v1').digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export async function isAdmin(): Promise<boolean> {
  const configured = secret();
  if (!configured) return false;
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  return Boolean(value && safeEqual(value, stamp(configured)));
}

export function adminConfigured(): boolean {
  return Boolean(secret());
}

export async function signIn(candidate: string): Promise<boolean> {
  const configured = secret();
  if (!configured || !safeEqual(candidate, configured)) return false;

  const jar = await cookies();
  jar.set(COOKIE, stamp(configured), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return true;
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
