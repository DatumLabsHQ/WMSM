import type { MapPoint } from '@/lib/map-types';

const COLUMNS = ['kind', 'name', 'description', 'detail', 'lat', 'lng', 'link'] as const;

function cell(value: string | number | boolean | null): string {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** The current view, as a file. Exporting the data is the point of a public directory. */
export function pointsToCsv(points: MapPoint[], origin: string): string {
  const rows = points.map((p) =>
    [
      p.layer.replace(/s$/, ''),
      p.name,
      p.blurb,
      p.meta,
      p.lat,
      p.lng,
      p.href ? (p.href.startsWith('http') ? p.href : `${origin}${p.href}`) : '',
    ]
      .map(cell)
      .join(','),
  );
  return [COLUMNS.join(','), ...rows].join('\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
