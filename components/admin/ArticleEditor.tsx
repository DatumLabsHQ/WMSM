'use client';

import { useState } from 'react';
import { saveArticle } from '@/app/admin/actions';
import { Button } from '@/components/ds/Button';
import { Card } from '@/components/ds/Card';
import { Input, Textarea } from '@/components/ds/Input';
import { Select } from '@/components/ds/Select';
import { autoExcerpt, readingMinutes } from '@/lib/markdown';

export interface EditorArticle {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  kind: string;
  status: string;
  publishedAt: string;
  companySlug: string;
  tags: string;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span className="wm-label">{label}</span>
      {children}
      {hint ? (
        <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function ArticleEditor({ article, companies }: { article?: EditorArticle; companies: { slug: string; name: string }[] }) {
  const [body, setBody] = useState(article?.body ?? '');
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? '');

  return (
    <form action={saveArticle} style={{ display: 'grid', gap: 'var(--space-5)' }}>
      {article ? <input type="hidden" name="id" value={article.id} /> : null}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <h1 style={{ font: 'var(--type-h1)' }}>{article ? 'Edit article' : 'New article'}</h1>
        <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
          {readingMinutes(body)} min read · {body.trim().split(/\s+/).filter(Boolean).length} words
        </span>
      </div>

      <Card padding="var(--space-6)" elevation="hairline" style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <Field label="Headline" hint="The slug is generated from this. Changing it on a published piece changes its URL.">
          <Input name="title" required defaultValue={article?.title} placeholder="Black Country Battery raises £22M" />
        </Field>

        <Field label="Standfirst" hint="One sentence. Used on cards, in the meta description and in the RSS feed.">
          <Input name="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="One line on why this matters." />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
          <Field label="Kind">
            <Select name="kind" defaultValue={article?.kind ?? 'story'} options={['story', 'funding', 'roundup', 'guide']} />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={article?.status ?? 'draft'} options={['draft', 'published']} />
          </Field>
          <Field label="Publish date" hint="Future date = scheduled">
            <Input name="publishedAt" type="date" defaultValue={article?.publishedAt} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
          <Field label="About a company" hint="Links the piece to a listing, both ways.">
            <Select
              name="companySlug"
              defaultValue={article?.companySlug ?? ''}
              options={[{ value: '', label: 'None' }, ...companies.map((c) => ({ value: c.slug, label: c.name }))]}
            />
          </Field>
          <Field label="Tags" hint="Comma separated. New ones are created and get their own page.">
            <Input name="tags" defaultValue={article?.tags} placeholder="funding, cleantech" />
          </Field>
        </div>
      </Card>

      <Card padding="var(--space-6)" elevation="hairline" style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <Field label="Body" hint="Markdown. Raw HTML is escaped, so a paste from anywhere is safe.">
          <Textarea name="body" required rows={22} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setExcerpt(autoExcerpt(body))}
            disabled={!body.trim()}
          >
            Draft a standfirst from the first paragraph
          </Button>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button type="submit" size="lg">
          Save
        </Button>
      </div>
    </form>
  );
}
