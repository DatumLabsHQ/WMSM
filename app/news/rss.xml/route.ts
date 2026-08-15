import { getArticles } from '@/lib/news';
import { siteUrl } from '@/lib/email/templates';

export const revalidate = 3600;

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A directory that wants organic reach should be syndicable. */
export async function GET() {
  const base = siteUrl();
  const articles = await getArticles(50);

  const items = articles
    .map(
      (a) => `    <item>
      <title>${escape(a.title)}</title>
      <link>${base}/news/${a.slug}</link>
      <guid isPermaLink="true">${base}/news/${a.slug}</guid>
      <description>${escape(a.excerpt)}</description>
      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
${a.tags.map((t) => `      <category>${escape(t.label)}</category>`).join('\n')}
    </item>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>West Midlands Startup Map — News</title>
    <link>${base}/news</link>
    <description>Funding, moves and analysis from startups across the West Midlands.</description>
    <language>en-GB</language>
    <atom:link href="${base}/news/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}
