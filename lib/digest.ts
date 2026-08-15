import 'server-only';
import { prisma } from '@/lib/db';
import { enqueueEmail, unsubscribeUrl } from '@/lib/email/send';
import * as tpl from '@/lib/email/templates';

/**
 * Builds and queues the weekly digest.
 *
 * Two rules keep this honest: only confirmed subscribers are ever included, and a
 * subscriber with nothing new to tell them is skipped rather than sent an empty
 * email. A week with no news is a week with no send.
 */
export interface DigestResult {
  batch: string;
  considered: number;
  queued: number;
  skippedEmpty: number;
}

export async function runDigest(now: Date = new Date()): Promise<DigestResult> {
  const since = new Date(now.getTime() - 7 * 86_400_000);
  const batch = `digest-${now.toISOString().slice(0, 10)}`;

  const [rounds, companies, jobs, articles, subscribers] = await Promise.all([
    prisma.round.findMany({
      where: { announced: { gte: since }, company: { status: 'published' } },
      orderBy: { amountGbp: 'desc' },
      take: 8,
      include: { company: { select: { name: true, slug: true } } },
    }),
    prisma.company.findMany({
      where: { status: 'published', createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { sector: { select: { label: true } } },
    }),
    prisma.job.findMany({
      where: { postedAt: { gte: since }, company: { status: 'published' } },
      orderBy: { postedAt: 'desc' },
      take: 10,
      include: { company: { select: { name: true, slug: true } } },
    }),
    prisma.article.findMany({
      where: { status: 'published', publishedAt: { gte: since, lte: now } },
      orderBy: { publishedAt: 'desc' },
      take: 4,
    }),
    prisma.subscriber.findMany({ where: { status: 'confirmed' } }),
  ]);

  const payload = {
    rounds: rounds.map((r) => ({
      companyName: r.company.name,
      companySlug: r.company.slug,
      amountGbp: r.amountGbp,
      stage: r.stage,
      announced: r.announced.toISOString(),
    })),
    companies: companies.map((c) => ({
      name: c.name,
      slug: c.slug,
      blurb: c.blurb,
      sector: c.sector.label,
      location: `${c.locality}, ${c.postcode.split(' ')[0]}`,
    })),
    jobs: jobs.map((j) => ({
      title: j.title,
      companyName: j.company.name,
      companySlug: j.company.slug,
      salaryLabel: j.salaryLabel,
      locality: j.locality,
    })),
    articles: articles.map((a) => ({ title: a.title, excerpt: a.excerpt, slug: a.slug })),
  };

  let queued = 0;
  let skippedEmpty = 0;

  for (const subscriber of subscribers) {
    const topics = subscriber.topics.split(',');
    const forThem = {
      rounds: topics.includes('funding') || topics.includes('weekly') ? payload.rounds : [],
      companies: topics.includes('weekly') ? payload.companies : [],
      jobs: topics.includes('jobs') || topics.includes('weekly') ? payload.jobs : [],
      articles: topics.includes('weekly') ? payload.articles : [],
    };

    const anything = forThem.rounds.length + forThem.companies.length + forThem.jobs.length + forThem.articles.length;
    if (!anything) {
      skippedEmpty += 1;
      continue;
    }

    await enqueueEmail({
      to: subscriber.email,
      template: 'digest',
      payload: { subscriberId: subscriber.id },
      category: 'bulk',
      batch,
      unsubToken: subscriber.unsubToken,
      rendered: tpl.digest({ ...forThem, unsubUrl: unsubscribeUrl(subscriber.unsubToken), weekOf: now }),
    });

    await prisma.subscriber.update({ where: { id: subscriber.id }, data: { lastSentAt: now } });
    queued += 1;
  }

  return { batch, considered: subscribers.length, queued, skippedEmpty };
}
