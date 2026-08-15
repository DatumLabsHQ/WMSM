import 'server-only';
import { prisma } from '@/lib/db';

/**
 * A directory tells you what is true today. A changelog tells you what moved,
 * which is the thing worth coming back for. The daily cron writes one row per
 * company; the profile reads the oldest row inside the window and diffs.
 */

export async function takeSnapshots(): Promise<{ written: number }> {
  const companies = await prisma.company.findMany({
    where: { status: 'published' },
    select: { id: true, headcountNum: true, raisedGbp: true, verified: true, claimed: true, _count: { select: { jobs: true } } },
  });

  if (!companies.length) return { written: 0 };

  await prisma.companySnapshot.createMany({
    data: companies.map((c) => ({
      companyId: c.id,
      headcountNum: c.headcountNum,
      openRoles: c._count.jobs,
      raisedGbp: c.raisedGbp,
      verified: c.verified,
      claimed: c.claimed,
    })),
  });

  // Keep a year per company; beyond that the chart nobody asked for gets expensive.
  await prisma.companySnapshot.deleteMany({ where: { takenAt: { lt: new Date(Date.now() - 365 * 86_400_000) } } });

  return { written: companies.length };
}

export interface Momentum {
  /** Days actually covered, which is not the window if the company is newer than it. */
  days: number;
  roles: number;
  raised: number;
  headcount: number;
  /** Nothing moved — the profile says so rather than showing a row of zeroes. */
  quiet: boolean;
}

export async function getMomentum(companyId: string, windowDays = 30): Promise<Momentum | null> {
  const since = new Date(Date.now() - windowDays * 86_400_000);

  const [earliest, company] = await Promise.all([
    prisma.companySnapshot.findFirst({
      where: { companyId, takenAt: { gte: since } },
      orderBy: { takenAt: 'asc' },
    }),
    prisma.company.findUnique({
      where: { id: companyId },
      select: { headcountNum: true, raisedGbp: true, _count: { select: { jobs: true } } },
    }),
  ]);

  if (!earliest || !company) return null;

  const roles = company._count.jobs - earliest.openRoles;
  const raised = company.raisedGbp - earliest.raisedGbp;
  const headcount = company.headcountNum - earliest.headcountNum;
  const days = Math.max(1, Math.round((Date.now() - earliest.takenAt.getTime()) / 86_400_000));

  return { days, roles, raised, headcount, quiet: roles === 0 && raised === 0 && headcount === 0 };
}

/** Region-wide version, for the funding page. */
export async function getRegionMomentum(windowDays = 30) {
  const since = new Date(Date.now() - windowDays * 86_400_000);
  const [newCompanies, newRounds, newRoles, newArticles] = await Promise.all([
    prisma.company.count({ where: { status: 'published', createdAt: { gte: since } } }),
    prisma.round.count({ where: { announced: { gte: since }, company: { status: 'published' } } }),
    prisma.job.count({ where: { postedAt: { gte: since }, company: { status: 'published' } } }),
    prisma.article.count({ where: { status: 'published', publishedAt: { gte: since, lte: new Date() } } }),
  ]);
  return { windowDays, newCompanies, newRounds, newRoles, newArticles };
}
