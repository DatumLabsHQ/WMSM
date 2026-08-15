import type { MetadataRoute } from 'next';
import { getCompanySlugs } from '@/lib/queries';
import { getArticleSlugs, getTags } from '@/lib/news';
import { getInvestorHubs, getPlaceHubs, getSectorHubs, getStageHubs } from '@/lib/hubs';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [companies, articles, tags, sectors, places, stages, investors] = await Promise.all([
    getCompanySlugs(),
    getArticleSlugs(),
    getTags(),
    getSectorHubs(),
    getPlaceHubs(),
    getStageHubs(),
    getInvestorHubs(),
  ]);
  const now = new Date();

  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/map`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/jobs`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/news`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/funding`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/newsletter`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/add`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/method`, changeFrequency: 'monthly', priority: 0.4 },

    // Editorial
    ...articles.map((slug) => ({ url: `${base}/news/${slug}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...tags.map((t) => ({ url: `${base}/news/tag/${t.slug}`, changeFrequency: 'weekly' as const, priority: 0.5 })),

    // Hubs — the pages built to be found
    ...sectors.map((s) => ({ url: `${base}/startups/${s.slug}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...places.map((p) => ({ url: `${base}/startups/in/${p.slug}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...stages.map((s) => ({ url: `${base}/startups/stage/${s.slug}`, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...investors.map((i) => ({ url: `${base}/investors/${i.slug}`, changeFrequency: 'weekly' as const, priority: 0.6 })),

    // Listings
    ...companies.map((slug) => ({ url: `${base}/company/${slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 })),
  ];
}
