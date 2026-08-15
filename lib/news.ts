import 'server-only';
import { prisma } from '@/lib/db';

/**
 * Reads for the editorial section. "Published" always means status published AND
 * publishedAt in the past, so scheduling works without a job to flip a flag.
 */

export interface ArticleCard {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  kind: string;
  publishedAt: string;
  readMinutes: number;
  authorName: string;
  tags: { slug: string; label: string }[];
  company: { name: string; slug: string; sectorColor: string } | null;
}

const publishedWhere = () => ({ status: 'published', publishedAt: { lte: new Date() } }) as const;

const articleInclude = {
  tags: { include: { tag: { select: { slug: true, label: true } } } },
  company: { select: { name: true, slug: true, sector: { select: { colorVar: true } } } },
} as const;

type Row = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  kind: string;
  publishedAt: Date | null;
  readMinutes: number;
  authorName: string;
  tags: { tag: { slug: string; label: string } }[];
  company: { name: string; slug: string; sector: { colorVar: string } } | null;
};

function toCard(a: Row): ArticleCard {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    kind: a.kind,
    publishedAt: (a.publishedAt ?? new Date()).toISOString(),
    readMinutes: a.readMinutes,
    authorName: a.authorName,
    tags: a.tags.map((t) => t.tag),
    company: a.company ? { name: a.company.name, slug: a.company.slug, sectorColor: a.company.sector.colorVar } : null,
  };
}

export async function getArticles(limit?: number): Promise<ArticleCard[]> {
  const rows = await prisma.article.findMany({
    where: publishedWhere(),
    orderBy: { publishedAt: 'desc' },
    take: limit,
    include: articleInclude,
  });
  return rows.map(toCard);
}

export async function getArticlesByTag(tagSlug: string): Promise<ArticleCard[]> {
  const rows = await prisma.article.findMany({
    where: { ...publishedWhere(), tags: { some: { tag: { slug: tagSlug } } } },
    orderBy: { publishedAt: 'desc' },
    include: articleInclude,
  });
  return rows.map(toCard);
}

export async function getArticlesForCompany(companySlug: string, limit = 3): Promise<ArticleCard[]> {
  const rows = await prisma.article.findMany({
    where: { ...publishedWhere(), company: { slug: companySlug } },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    include: articleInclude,
  });
  return rows.map(toCard);
}

export async function getArticle(slug: string) {
  const a = await prisma.article.findFirst({ where: { slug, ...publishedWhere() }, include: articleInclude });
  if (!a) return null;
  return { ...toCard(a), body: a.body, seoTitle: a.seoTitle, seoDescription: a.seoDescription, updatedAt: a.updatedAt.toISOString() };
}

export type ArticleDetail = NonNullable<Awaited<ReturnType<typeof getArticle>>>;

export async function getArticleSlugs(): Promise<string[]> {
  const rows = await prisma.article.findMany({ where: publishedWhere(), select: { slug: true } });
  return rows.map((r) => r.slug);
}

export async function getTags(): Promise<{ slug: string; label: string; blurb: string; count: number }[]> {
  const tags = await prisma.tag.findMany({
    include: { articles: { where: { article: publishedWhere() }, select: { articleId: true } } },
  });
  return tags
    .map((t) => ({ slug: t.slug, label: t.label, blurb: t.blurb, count: t.articles.length }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
}

export async function getTag(slug: string) {
  return prisma.tag.findUnique({ where: { slug } });
}
