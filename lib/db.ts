import { PrismaClient } from '@/lib/prisma/generated/client';
import { PrismaNeon } from '@prisma/adapter-neon';

/**
 * One client per process.
 *
 * The Neon serverless driver is used rather than node-postgres because this runs
 * on Cloudflare Workers, which cannot open a raw TCP socket — Neon speaks HTTP and
 * WebSocket instead. It works identically in local development, so there is one
 * code path rather than two.
 *
 * Next's dev server reloads modules on every edit, so the instance is parked on
 * globalThis to stop connections piling up.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function create() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
}

export const prisma = globalForPrisma.prisma ?? create();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
