import Link from 'next/link';
import { fullDate } from '@/lib/format';
import type { ArticleCard as Card } from '@/lib/news';

const KIND_LABEL: Record<string, string> = {
  story: 'Story',
  funding: 'Funding',
  roundup: 'Roundup',
  guide: 'Guide',
};

/** One row in the news index. Text-led — the tiles belong to the gallery. */
export function ArticleCard({ article, featured = false }: { article: Card; featured?: boolean }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="wm-article"
      style={{
        display: 'grid',
        gap: 8,
        padding: featured ? 'var(--space-6)' : 'var(--space-5)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-hairline)',
        color: 'inherit',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            font: 'var(--weight-medium) var(--text-3xs)/1 var(--font-body)',
            letterSpacing: 'var(--tracking-label)',
            textTransform: 'uppercase',
            color: 'var(--route-600)',
            background: 'var(--route-100)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-pill)',
          }}
        >
          {KIND_LABEL[article.kind] ?? article.kind}
        </span>
        <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
          {fullDate(new Date(article.publishedAt))} · {article.readMinutes} min read
        </span>
      </span>

      <span
        style={{
          font: `var(--weight-semibold) ${featured ? 'var(--text-2xl)' : 'var(--text-lg)'}/1.25 var(--font-display)`,
          letterSpacing: 'var(--tracking-heading)',
          color: 'var(--text-primary)',
        }}
      >
        {article.title}
      </span>

      <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)' }}>{article.excerpt}</span>

      {article.tags.length ? (
        <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
          {article.tags.map((t) => (
            <span key={t.slug} className="wm-data" style={{ color: 'var(--text-muted)' }}>
              #{t.slug}
            </span>
          ))}
        </span>
      ) : null}
    </Link>
  );
}
