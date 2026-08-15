/** The region the map covers: Birmingham, Solihull, Coventry, Warwickshire, the Black Country. */
export const WM_BOUNDS = {
  north: 52.68,
  south: 52.16,
  west: -2.22,
  east: -1.24,
};

export const WM_CENTRE: [number, number] = [52.46, -1.84];
export const WM_DEFAULT_ZOOM = 10;

/**
 * Flattens a lat/lng into a percentage inside a box, for the paper MapCanvas used
 * in the hero and on cards. Good enough at this latitude; the real map uses Leaflet.
 */
export function projectToBox(lat: number, lng: number, inset = 8): { left: string; top: string } {
  const x = (lng - WM_BOUNDS.west) / (WM_BOUNDS.east - WM_BOUNDS.west);
  const y = (WM_BOUNDS.north - lat) / (WM_BOUNDS.north - WM_BOUNDS.south);
  const span = 100 - inset * 2;
  return {
    left: `${(inset + Math.min(Math.max(x, 0), 1) * span).toFixed(2)}%`,
    top: `${(inset + Math.min(Math.max(y, 0), 1) * span).toFixed(2)}%`,
  };
}
