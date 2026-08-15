import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState } from '@/components/ds/EmptyState';
import { ArticleCard } from '@/components/news/ArticleCard';
import { DigestSignup } from '@/components/site/DigestSignup';
import { getArticles, getTags } from '@/lib/news';
import { plural } from '@/lib/format';

export const metadata: Metadata = {
  title: 'News',
  description:
    'Funding, moves and analysis from startups across Birmingham, Solihull, Coventry, Warwickshire and the Black Country. Written by people who read the filings.',
  alternates: { types: { 'application/rss+xml': '/news/rss.xml' } },
};

export default async function NewsPage() {
  const [articles, tags] = await Promise.all([getArticles(), getTags()]);
  const [lead, ...rest] = articles;

  return (
    <>
      <section className="wm-hero">
        <h1>What is actually happening here</h1>
        <p>
          Raises, moves and the occasional argument about the region&rsquo;s tech scene. Written from the same data as the map, so the
          numbers in the copy match the numbers on the listings.
        </p>
      </section>

      <div className="wm-page" style={{ paddingBottom: 'var(--space-24)' }}>
        {tags.length ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 'var(--space-8)' }}>
            {tags.map((t) => (
              <Link key={t.slug} href={`/news/tag/${t.slug}`} className="ds-chip">
                {t.label}
                <span className="wm-data" style={{ opacity: 0.7 }}>
                  {t.count}
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        {articles.length ? (
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {lead ? <ArticleCard article={lead} featured /> : null}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
              {rest.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon="list"
            title="Nothing published yet"
            message="The first pieces are being written. Subscribe and they will reach you before they reach anyone else."
          />
        )}

        <p style={{ textAlign: 'center', margin: 'var(--space-8) 0 0' }}>
          <Link href="/news/rss.xml" style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
            RSS feed
          </Link>
          {articles.length ? (
            <span className="wm-data" style={{ color: 'var(--ink-300)' }}>
              {' '}
              · {plural(articles.length, 'piece')} so far
            </span>
          ) : null}
        </p>

        <div style={{ marginTop: 'var(--space-10)' }}>
          <DigestSignup source="news" />
        </div>
      </div>
    </>
  );
}
