import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ds/Card';
import { Icon } from '@/components/ds/Icon';
import { BrandTile } from '@/components/gallery/BrandTile';
import { ArticleCard } from '@/components/news/ArticleCard';
import { DigestSignup } from '@/components/site/DigestSignup';
import { getArticle, getArticleSlugs, getArticles } from '@/lib/news';
import { renderMarkdown } from '@/lib/markdown';
import { fullDate } from '@/lib/format';
import { siteUrl } from '@/lib/email/templates';

export async function generateStaticParams() {
  const slugs = await getArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: 'Not found' };
  return {
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.excerpt,
    alternates: { canonical: `/news/${article.slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.authorName],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const html = renderMarkdown(article.body);
  const more = (await getArticles(4)).filter((a) => a.slug !== slug).slice(0, 3);
  const base = siteUrl();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { '@type': 'Organization', name: article.authorName },
    publisher: { '@type': 'Organization', name: 'West Midlands Startup Map' },
    mainEntityOfPage: `${base}/news/${article.slug}`,
    ...(article.company ? { about: { '@type': 'Organization', name: article.company.name } } : {}),
  };

  return (
    <article style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-6) var(--space-6) var(--space-24)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link
        href="/news"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', font: 'var(--type-body-sm)' }}
      >
        <Icon name="chevron-left" size={15} />
        All news
      </Link>

      <header style={{ display: 'grid', gap: 'var(--space-4)', margin: 'var(--space-6) 0 var(--space-8)' }}>
        <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
          {fullDate(new Date(article.publishedAt))} · {article.readMinutes} min read · {article.authorName}
        </span>
        <h1 style={{ font: 'var(--weight-bold) var(--text-3xl)/1.12 var(--font-display)', letterSpacing: 'var(--tracking-display)' }}>
          {article.title}
        </h1>
        <p style={{ font: 'var(--type-body)', fontSize: 'var(--text-lg)', color: 'var(--text-secondary)', margin: 0 }}>
          {article.excerpt}
        </p>
        {article.tags.length ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {article.tags.map((t) => (
              <Link key={t.slug} href={`/news/tag/${t.slug}`} className="ds-chip">
                {t.label}
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      {/* The subject of the piece, if it is about one company. */}
      {article.company ? (
        <Link
          href={`/company/${article.company.slug}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-card)',
            boxShadow: 'var(--shadow-hairline)',
            marginBottom: 'var(--space-8)',
            color: 'inherit',
          }}
        >
          <span
            style={{
              position: 'relative',
              containerType: 'inline-size',
              width: 96,
              aspectRatio: '8 / 5',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              flex: '0 0 auto',
            }}
          >
            <BrandTile name={article.company.name} slug={article.company.slug} color={article.company.sectorColor} />
          </span>
          <span style={{ display: 'grid', gap: 2 }}>
            <span className="wm-label">In this piece</span>
            <span style={{ font: 'var(--type-h3)' }}>{article.company.name}</span>
            <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
              See the listing →
            </span>
          </span>
        </Link>
      ) : null}

      <div className="wm-prose" dangerouslySetInnerHTML={{ __html: html }} />

      <div style={{ marginTop: 'var(--space-14)' }}>
        <DigestSignup source="news" compact />
      </div>

      {more.length ? (
        <section style={{ marginTop: 'var(--space-14)' }}>
          <h2 style={{ font: 'var(--type-h2)', marginBottom: 'var(--space-4)' }}>More from the map</h2>
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {more.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
