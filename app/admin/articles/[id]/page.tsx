import { notFound } from 'next/navigation';
import { ArticleEditor } from '@/components/admin/ArticleEditor';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (id === 'new') {
    const companies = await prisma.company.findMany({ where: { status: 'published' }, select: { slug: true, name: true }, orderBy: { name: 'asc' } });
    return <ArticleEditor companies={companies} />;
  }

  const [article, companies] = await Promise.all([
    prisma.article.findUnique({ where: { id }, include: { tags: { include: { tag: true } }, company: { select: { slug: true } } } }),
    prisma.company.findMany({ where: { status: 'published' }, select: { slug: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  if (!article) notFound();

  return (
    <ArticleEditor
      companies={companies}
      article={{
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        body: article.body,
        kind: article.kind,
        status: article.status,
        publishedAt: article.publishedAt ? article.publishedAt.toISOString().slice(0, 10) : '',
        companySlug: article.company?.slug ?? '',
        tags: article.tags.map((t) => t.tag.slug).join(', '),
      }}
    />
  );
}
