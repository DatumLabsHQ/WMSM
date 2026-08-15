import Link from 'next/link';
import { Card } from '@/components/ds/Card';
import { EmptyState } from '@/components/ds/EmptyState';
import { prisma } from '@/lib/db';
import { deleteArticle } from '../actions';
import { fullDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminArticles() {
  const articles = await prisma.article.findMany({
    orderBy: [{ status: 'asc' }, { publishedAt: 'desc' }],
    include: { tags: { include: { tag: true } } },
  });

  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <h1 style={{ font: 'var(--type-h1)' }}>Articles</h1>
        <Link href="/admin/articles/new" className="ds-btn ds-btn--primary ds-btn--base">
          Write one
        </Link>
      </div>

      {articles.length ? (
        <Card padding="var(--space-5)" elevation="hairline">
          {articles.map((a) => (
            <div key={a.id} className="ds-row">
              <span style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/admin/articles/${a.id}`} style={{ font: 'var(--type-ui)', color: 'var(--text-primary)' }}>
                  {a.title}
                </Link>
                <br />
                <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
                  {a.status}
                  {a.publishedAt ? ` · ${fullDate(a.publishedAt)}` : ''} · {a.readMinutes} min ·{' '}
                  {a.tags.map((t) => t.tag.label).join(', ') || 'untagged'}
                </span>
              </span>
              <span style={{ display: 'flex', gap: 8 }}>
                {a.status === 'published' ? (
                  <Link href={`/news/${a.slug}`} className="ds-btn ds-btn--secondary ds-btn--sm">
                    View
                  </Link>
                ) : null}
                <form action={deleteArticle}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="ds-btn ds-btn--ghost ds-btn--sm">
                    Delete
                  </button>
                </form>
              </span>
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState icon="list" title="Nothing written yet" message="The first piece is the hardest." />
      )}
    </div>
  );
}
