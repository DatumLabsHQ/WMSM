import 'server-only';
import { prisma } from '@/lib/db';
import { eventDate, eventTime } from '@/lib/format';

/**
 * The map plots three kinds of thing, so they share one shape — defined in
 * lib/map-types.ts, which the client map can import without pulling Prisma in.
 */
import { LAYER_COLOR, type MapPoint } from '@/lib/map-types';

export type { MapLayer, MapPoint } from '@/lib/map-types';
export { LAYER_COLOR, LAYER_LABEL } from '@/lib/map-types';

export async function getMapPoints(): Promise<MapPoint[]> {
  const [companies, events, spaces] = await Promise.all([
    prisma.company.findMany({
      where: { status: 'published' },
      include: { sector: { select: { label: true, slug: true, colorVar: true } }, _count: { select: { jobs: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.event.findMany({ where: { startsAt: { gte: new Date(Date.now() - 86_400_000) } }, orderBy: { startsAt: 'asc' } }),
    prisma.space.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const companyPoints: MapPoint[] = companies.map((c) => ({
    id: `company:${c.slug}`,
    layer: 'companies',
    name: c.name,
    blurb: c.blurb,
    meta: `${c.sector.label} · ${c.stage} · ${c.locality}, ${c.postcode.split(' ')[0]}`,
    lat: c.lat,
    lng: c.lng,
    color: c.sector.colorVar,
    logoUrl: c.logoUrl,
    href: `/company/${c.slug}`,
    sectorSlug: c.sector.slug,
    hiring: c.hiring,
  }));

  const eventPoints: MapPoint[] = events.map((e) => ({
    id: `event:${e.id}`,
    layer: 'events',
    name: e.title,
    blurb: `${e.venue}, ${e.locality}`,
    meta: `${eventDate(e.startsAt)} · ${eventTime(e.startsAt)}`,
    lat: e.lat,
    lng: e.lng,
    color: LAYER_COLOR.events,
    href: e.rsvpUrl ?? '/funding?feed=events',
    startsAt: e.startsAt.toISOString(),
  }));

  const spacePoints: MapPoint[] = spaces.map((s) => ({
    id: `space:${s.id}`,
    layer: 'spaces',
    name: s.name,
    blurb: `${s.locality}, ${s.postcode}`,
    meta: s.deskNote,
    lat: s.lat,
    lng: s.lng,
    color: LAYER_COLOR.spaces,
    href: '/funding?feed=spaces',
  }));

  return [...companyPoints, ...eventPoints, ...spacePoints];
}
