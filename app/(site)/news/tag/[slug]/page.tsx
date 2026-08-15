import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleCard } from '@/components/news/ArticleCard';
import { getArticlesByTag, getTag, getTags } from '@/lib/news';
import { plural } from '@/lib/format';

export async function generateStaticParams() {
  const tags = await getTags();
  return tags.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTag(slug);
  if (!tag) return { title: 'Not found' };
  return {
    title: `${tag.label} news`,
    description: tag.blurb || `Everything we have written about ${tag.label.toLowerCase()} in the West Midlands.`,
    alternates: { canonical: `/news/tag/${tag.slug}` },
  };
}

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [tag, articles] = await Promise.all([getTag(slug), getArticlesByTag(slug)]);
  if (!tag) notFound();

  return (
    <>
      <section className="wm-hero">
        <h1>{tag.label}</h1>
        <p>{tag.blurb || `Everything we have written about ${tag.label.toLowerCase()} in the West Midlands.`}</p>
        <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
          {plural(articles.length, 'piece')}
        </span>
      </section>

      <div className="wm-page" style={{ paddingBottom: 'var(--space-24)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      </div>
    </>
  );
}
