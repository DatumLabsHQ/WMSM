import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Prisma 7 no longer auto-loads .env. Next.js does it for the app; the CLI needs a nudge.
try {
  process.loadEnvFile(path.join(process.cwd(), '.env'));
} catch {
  // no .env checked out — fall through to the default below
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
