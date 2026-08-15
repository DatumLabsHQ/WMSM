'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ICONS } from '@/lib/icons.generated';
import { WM_CENTRE, WM_DEFAULT_ZOOM } from '@/lib/geo';
import type { MapPoint } from '@/lib/map-types';

interface Cluster {
  lat: number;
  lng: number;
  count: number;
}

/** Below zoom 12 the region is a soup of overlapping pins, so nearby ones merge into a count. */
function clusterise(list: MapPoint[], zoom: number): { singles: MapPoint[]; clusters: Cluster[] } {
  if (zoom >= 12) return { singles: list, clusters: [] };
  const cell = zoom <= 9 ? 0.14 : 0.07;
  const buckets = new Map<string, MapPoint[]>();
  for (const c of list) {
    const key = `${Math.round(c.lat / cell)}_${Math.round(c.lng / cell)}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(c);
    else buckets.set(key, [c]);
  }
  const singles: MapPoint[] = [];
  const clusters: Cluster[] = [];
  for (const group of buckets.values()) {
    if (group.length >= 3) {
      clusters.push({
        lat: group.reduce((s, c) => s + c.lat, 0) / group.length,
        lng: group.reduce((s, c) => s + c.lng, 0) / group.length,
        count: group.length,
      });
    } else singles.push(...group);
  }
  return { singles, clusters };
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);

function glyph(name: keyof typeof ICONS, size: number, color: string) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
}

/**
 * Marker shape carries the layer, colour carries the detail. Companies keep the
 * teardrop; events and spaces take rounded squares with their own glyph, so the
 * three layers stay legible on top of each other without a key.
 */
function markerHtml(point: MapPoint, isSelected: boolean): { html: string; size: [number, number]; anchor: [number, number] } {
  const chip = isSelected
    ? `<span class="ds-overlay" style="padding:2px 7px;border-radius:999px;font:500 11px/1.3 var(--font-body);color:var(--text-primary);white-space:nowrap;margin-top:4px;box-shadow:0 1px 4px rgba(3,7,45,.18)">${escapeHtml(
        point.name,
      )}</span>`
    : '';

  if (point.layer === 'companies') {
    // A real mark beats a coloured dot. The sector hue survives as the ring, so
    // the map is still readable against the legend.
    if (point.logoUrl) {
      const s = isSelected ? 38 : 34;
      const html = `<div class="wm-pin${isSelected ? ' wm-pin--on' : ''}" style="--pin:${point.color};display:grid;justify-items:center;width:max-content;transform:translateX(calc(-50% + ${
        s / 2
      }px))"><span class="wm-pin__chip" style="width:${s}px;height:${s}px"><img class="wm-pin__logo" src="${escapeHtml(
        point.logoUrl,
      )}" alt="" loading="lazy"><span class="wm-pin__initial">${escapeHtml(point.name.charAt(0).toUpperCase())}</span></span>${chip}</div>`;
      return { html, size: [s, s], anchor: [s / 2, s] };
    }

    const s = isSelected ? 33 : 28;
    const html = `<div style="display:grid;justify-items:center;width:max-content;transform:translateX(calc(-50% + ${s / 2}px))"><div style="width:${s}px;height:${s}px;border-radius:50% 50% 50% 4px;transform:rotate(45deg);background:${
      point.color
    };border:2px solid ${isSelected ? 'var(--ink-900)' : 'rgba(255,255,255,.92)'};box-shadow:${
      isSelected ? 'var(--shadow-pin)' : 'var(--shadow-sm)'
    }"></div>${chip}</div>`;
    return { html, size: [s, s], anchor: [s / 2, s] };
  }

  const s = isSelected ? 34 : 30;
  const icon = point.layer === 'events' ? 'calendar' : 'building-2';
  const html = `<div style="display:grid;justify-items:center;width:max-content;transform:translateX(calc(-50% + ${s / 2}px))"><div style="width:${s}px;height:${s}px;border-radius:9px;background:${
    point.color
  };border:2px solid ${isSelected ? 'var(--ink-900)' : 'rgba(255,255,255,.92)'};box-shadow:${
    isSelected ? 'var(--shadow-pin)' : 'var(--shadow-sm)'
  };display:flex;align-items:center;justify-content:center">${glyph(icon, 15, '#fff')}</div>${chip}</div>`;
  return { html, size: [s, s], anchor: [s / 2, s] };
}

export interface LiveMapProps {
  points: MapPoint[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  command?: { type: 'in' | 'out' | 'reset'; nonce: number } | null;
}

export function LiveMap({ points, selected, onSelect, command }: LiveMapProps) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const selectRef = useRef(onSelect);
  const [zoom, setZoom] = useState(WM_DEFAULT_ZOOM);

  selectRef.current = onSelect;

  useEffect(() => {
    if (!holder.current || map.current) return;
    const m = L.map(holder.current, { zoomControl: false, attributionControl: true }).setView(WM_CENTRE, WM_DEFAULT_ZOOM);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);

    // Company logos are third-party URLs; some will 404 or hotlink-block. When one
    // does, fall back to the sector colour and the initial rather than a blank chip.
    holder.current.addEventListener(
      'error',
      (event) => {
        const target = event.target as HTMLElement | null;
        if (target?.classList.contains('wm-pin__logo')) {
          target.closest('.wm-pin')?.classList.add('wm-pin--nologo');
        }
      },
      true,
    );

    m.on('zoomend', () => setZoom(m.getZoom()));
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      layer.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !command) return;
    if (command.type === 'in') m.zoomIn();
    if (command.type === 'out') m.zoomOut();
    if (command.type === 'reset') m.setView(WM_CENTRE, WM_DEFAULT_ZOOM);
  }, [command]);

  useEffect(() => {
    const m = map.current;
    const group = layer.current;
    if (!m || !group) return;
    group.clearLayers();

    // Companies cluster because there are many; events and spaces never do —
    // there are few of them and hiding one behind a count helps nobody.
    const companies = points.filter((p) => p.layer === 'companies' && p.id !== selected);
    const others = points.filter((p) => p.layer !== 'companies' && p.id !== selected);
    const { singles, clusters } = clusterise(companies, zoom);

    const chosen = points.find((p) => p.id === selected);
    const drawn = [...singles, ...others];
    if (chosen) drawn.push(chosen);

    for (const point of drawn) {
      const isSelected = point.id === selected;
      const { html, size, anchor } = markerHtml(point, isSelected);
      L.marker([point.lat, point.lng], {
        icon: L.divIcon({ html, className: '', iconSize: size, iconAnchor: anchor }),
        zIndexOffset: isSelected ? 1000 : point.layer === 'companies' ? 0 : 400,
        keyboard: true,
        title: `${point.name} — ${point.meta}`,
        alt: point.name,
      })
        .on('click', () => selectRef.current(point.id))
        .on('keypress', () => selectRef.current(point.id))
        .addTo(group);
    }

    for (const cl of clusters) {
      const d = 34 + Math.min(cl.count, 12);
      const html = `<div style="width:${d}px;height:${d}px;border-radius:50%;background:var(--ink-800);color:#fff;display:flex;align-items:center;justify-content:center;font:600 13px/1 var(--font-body);border:2px solid rgba(255,255,255,.9);box-shadow:var(--shadow-pin)">${cl.count}</div>`;
      L.marker([cl.lat, cl.lng], {
        icon: L.divIcon({ html, className: '', iconSize: [d, d], iconAnchor: [d / 2, d / 2] }),
        keyboard: true,
        title: `${cl.count} companies — zoom in`,
        alt: `${cl.count} companies`,
      })
        .on('click', () => m.flyTo([cl.lat, cl.lng], Math.min(m.getZoom() + 2, 13), { duration: 0.52 }))
        .addTo(group);
    }

    if (chosen) m.flyTo([chosen.lat, chosen.lng], Math.max(m.getZoom(), 12), { duration: 0.52 });
  }, [points, selected, zoom]);

  return <div ref={holder} style={{ position: 'absolute', inset: 0, zIndex: 0 }} aria-label="Map of listed companies, events and spaces" role="application" />;
}
