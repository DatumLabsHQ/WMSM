import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/email/templates';

export const revalidate = 900;

/**
 * Public, CORS-open JSON for the careers-page widget. Read-only, cached, and
 * scoped by company or sector so a host page only ever pulls what it asked for.
 */
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'cache-control': 'public, max-age=900, s-maxage=900, stale-while-revalidate=3600',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company');
  const sector = searchParams.get('sector');
  const limit = Math.min(Number(searchParams.get('limit') ?? 8) || 8, 25);
  const base = siteUrl();

  const jobs = await prisma.job.findMany({
    where: {
      company: {
        status: 'published',
        ...(company ? { slug: company } : {}),
        ...(sector ? { sector: { slug: sector } } : {}),
      },
    },
    orderBy: { postedAt: 'desc' },
    take: limit,
    include: { company: { select: { name: true, slug: true, sector: { select: { label: true } } } } },
  });

  return NextResponse.json(
    {
      source: 'West Midlands Startup Map',
      sourceUrl: base,
      count: jobs.length,
      jobs: jobs.map((j) => ({
        title: j.title,
        company: j.company.name,
        companyUrl: `${base}/company/${j.company.slug}`,
        sector: j.company.sector.label,
        locality: j.locality,
        arrangement: j.arrangement,
        salary: j.salaryLabel,
        postedAt: j.postedAt.toISOString(),
        url: `${base}/company/${j.company.slug}#roles`,
      })),
    },
    { headers: CORS },
  );
}
