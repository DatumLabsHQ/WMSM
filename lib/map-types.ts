/**
 * Shared between the server query and the client map, so it must stay free of
 * anything server-only — importing the query module from a client component drags
 * Prisma into the browser bundle.
 */
export type MapLayer = 'companies' | 'events' | 'spaces';

export interface MapPoint {
  id: string;
  layer: MapLayer;
  name: string;
  blurb: string;
  /** Printed under the name in the result row and used as the marker title. */
  meta: string;
  lat: number;
  lng: number;
  color: string;
  href?: string;
  /** Companies only, for the sector filter. */
  sectorSlug?: string;
  /** Companies only. When present the marker shows the real mark instead of a colour. */
  logoUrl?: string | null;
  hiring?: boolean;
  /** Events only, so the list can sort and label by date. */
  startsAt?: string;
}

export const LAYER_COLOR: Record<MapLayer, string> = {
  companies: 'var(--route-500)',
  events: 'var(--sector-creative)',
  spaces: 'var(--sector-cleantech)',
};

export const LAYER_LABEL: Record<MapLayer, string> = {
  companies: 'Companies',
  events: 'Events',
  spaces: 'Spaces',
};
