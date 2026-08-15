'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppRail } from '@/components/app/AppRail';
import { Badge } from '@/components/ds/Badge';
import { Button, ButtonLink } from '@/components/ds/Button';
import { EmptyState } from '@/components/ds/EmptyState';
import { FilterChip } from '@/components/ds/FilterChip';
import { Icon } from '@/components/ds/Icon';
import { IconButton } from '@/components/ds/IconButton';
import { Input } from '@/components/ds/Input';
import { MapCanvas } from '@/components/ds/MapCanvas';
import { Switch } from '@/components/ds/Switch';
import { Tabs } from '@/components/ds/Tabs';
import { Toast } from '@/components/ds/Toast';
import { Tooltip } from '@/components/ds/Tooltip';
import { pointsToCsv, downloadCsv } from '@/lib/csv';
import { count, plural } from '@/lib/format';
import { useSaved } from '@/lib/useSaved';
import { LAYER_COLOR, LAYER_LABEL, type MapLayer, type MapPoint } from '@/lib/map-types';
import type { SectorView } from '@/lib/queries';

const LiveMap = dynamic(() => import('./LiveMap').then((m) => m.LiveMap), {
  ssr: false,
  loading: () => <MapCanvas />,
});

const ALL_LAYERS: MapLayer[] = ['companies', 'events', 'spaces'];

export interface MapExplorerProps {
  points: MapPoint[];
  sectors: SectorView[];
}

export function MapExplorer({ points, sectors }: MapExplorerProps) {
  const router = useRouter();
  const params = useSearchParams();

  const selected = params.get('id');
  const activeSectors = useMemo(() => (params.get('sector') ?? '').split(',').filter(Boolean), [params]);
  const query = params.get('q') ?? '';
  const hiringOnly = params.get('hiring') === '1';
  const savedOnly = params.get('saved') === '1';

  // Layers default to all on: the point of the rail is that everything plots.
  const activeLayers = useMemo<MapLayer[]>(() => {
    const raw = params.get('layers');
    if (raw === null) return ALL_LAYERS;
    const chosen = raw.split(',').filter((l): l is MapLayer => ALL_LAYERS.includes(l as MapLayer));
    return chosen;
  }, [params]);

  const [tab, setTab] = useState<MapLayer>('companies');
  const { saved, toggle: toggleSaved, isSaved } = useSaved();
  const [command, setCommand] = useState<{ type: 'in' | 'out' | 'reset'; nonce: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const patch = useCallback(
    (next: Record<string, string | null>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === null || v === '') sp.delete(k);
        else sp.set(k, v);
      }
      router.replace(sp.size ? `/map?${sp}` : '/map', { scroll: false });
    },
    [params, router],
  );

  /** Filters apply to companies; events and spaces are only ever on or off. */
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return points.filter((p) => {
      if (!activeLayers.includes(p.layer)) return false;
      if (needle && !`${p.name} ${p.blurb} ${p.meta}`.toLowerCase().includes(needle)) return false;
      if (p.layer !== 'companies') return true;
      if (activeSectors.length && !(p.sectorSlug && activeSectors.includes(p.sectorSlug))) return false;
      if (hiringOnly && !p.hiring) return false;
      if (savedOnly && !saved.includes(p.id)) return false;
      return true;
    });
  }, [points, activeLayers, activeSectors, hiringOnly, savedOnly, saved, query]);

  const byLayer = useMemo(() => {
    const out: Record<MapLayer, MapPoint[]> = { companies: [], events: [], spaces: [] };
    for (const p of visible) out[p.layer].push(p);
    return out;
  }, [visible]);

  const counts = useMemo(() => {
    const out: Record<MapLayer, number> = { companies: 0, events: 0, spaces: 0 };
    for (const p of points) out[p.layer] += 1;
    return out;
  }, [points]);

  // The list follows the tab, but a tab whose layer is switched off would be empty
  // and confusing, so fall back to the first layer that is actually on.
  const listLayer: MapLayer = activeLayers.includes(tab) ? tab : (activeLayers[0] ?? 'companies');
  const list = byLayer[listLayer];
  const chosen = visible.find((p) => p.id === selected) ?? points.find((p) => p.id === selected) ?? null;

  const toggleLayer = (layer: MapLayer) => {
    const next = activeLayers.includes(layer) ? activeLayers.filter((l) => l !== layer) : [...activeLayers, layer];
    patch({ layers: next.length === ALL_LAYERS.length ? null : next.join(','), id: null });
    if (!activeLayers.includes(layer)) setTab(layer);
  };

  const toggleSector = (slug: string) => {
    const next = activeSectors.includes(slug) ? activeSectors.filter((s) => s !== slug) : [...activeSectors, slug];
    patch({ sector: next.join(','), id: null });
  };

  const clearAll = () => patch({ sector: null, q: null, hiring: null, saved: null, id: null });

  const exportView = () => {
    downloadCsv(`wm-startup-map-${visible.length}-points.csv`, pointsToCsv(visible, window.location.origin));
    setToast(`Exported ${plural(visible.length, 'row')}`);
  };

  const filtersOn = activeSectors.length > 0 || Boolean(query) || hiringOnly || savedOnly;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      <div className="wm-app-frame" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <AppRail
          active={activeLayers}
          counts={counts}
          onToggle={toggleLayer}
          savedCount={saved.length}
          savedOn={savedOnly}
          onToggleSaved={() => patch({ saved: savedOnly ? null : '1' })}
          onExport={exportView}
        />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          {/* Sector chips only bite on the company layer, so they hide when it is off. */}
          {activeLayers.includes('companies') ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--surface-card)',
                boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
                flexWrap: 'wrap',
                flex: '0 0 auto',
              }}
            >
              {sectors.map((s) => (
                <FilterChip
                  key={s.slug}
                  icon={s.icon}
                  color={s.color}
                  count={s.count}
                  selected={activeSectors.includes(s.slug)}
                  onClick={() => toggleSector(s.slug)}
                >
                  {s.label}
                </FilterChip>
              ))}
              {savedOnly ? (
                <FilterChip selected icon="bookmark" onClick={() => patch({ saved: null })}>
                  Saved only
                </FilterChip>
              ) : null}
              {filtersOn ? (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="wm-app-body" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <section
              aria-label="Results"
              className="wm-panel"
              style={{
                width: 'var(--panel-w)',
                flex: '0 0 auto',
                background: 'var(--surface-card)',
                boxShadow: 'inset -1px 0 0 var(--border-hairline)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              <div
                style={{
                  padding: 'var(--space-4)',
                  display: 'grid',
                  gap: 'var(--space-3)',
                  boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
                }}
              >
                <Input
                  icon="search"
                  type="search"
                  aria-label="Search companies, events and spaces"
                  placeholder="Search the map"
                  value={query}
                  onChange={(e) => patch({ q: e.target.value || null })}
                />

                {activeLayers.length ? (
                  <Tabs
                    variant="segmented"
                    label="Map layers"
                    tabs={activeLayers.map((l) => ({ value: l, label: LAYER_LABEL[l], count: byLayer[l].length }))}
                    value={listLayer}
                    onChange={(v) => setTab(v as MapLayer)}
                  />
                ) : null}

                {listLayer === 'companies' ? (
                  <Switch checked={hiringOnly} label="Hiring only" onChange={(e) => patch({ hiring: e.target.checked ? '1' : null })} />
                ) : null}
              </div>

              <div className="wm-scroll" style={{ flex: 1, minHeight: 0 }}>
                {!activeLayers.length ? (
                  <EmptyState
                    icon="layers"
                    title="Every layer is switched off"
                    message="Turn one back on from the rail and the map fills up again."
                    action={
                      <Button size="sm" variant="secondary" onClick={() => patch({ layers: null })}>
                        Show everything
                      </Button>
                    }
                  />
                ) : list.length ? (
                  list.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={selected === p.id}
                      onClick={() => patch({ id: selected === p.id ? null : p.id })}
                      className="ds-company"
                    >
                      <span
                        className="ds-company__monogram"
                        style={{
                          background: p.color,
                          borderRadius: p.layer === 'companies' ? 'var(--radius-sm)' : 'var(--radius-pill)',
                        }}
                        aria-hidden="true"
                      >
                        {p.layer === 'companies' ? (
                          p.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join('')
                            .toUpperCase()
                        ) : (
                          <Icon name={p.layer === 'events' ? 'calendar' : 'building-2'} size={17} color="#fff" />
                        )}
                      </span>
                      <span style={{ display: 'grid', gap: 5, minWidth: 0, flex: 1 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="ds-company__name">{p.name}</span>
                          {p.hiring ? (
                            <Badge tone="success" dot>
                              Hiring
                            </Badge>
                          ) : null}
                        </span>
                        <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)' }}>{p.blurb}</span>
                        <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
                          {p.meta}
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <EmptyState
                    title={`No ${LAYER_LABEL[listLayer].toLowerCase()} in this view`}
                    message={
                      savedOnly
                        ? 'You have not saved anything yet. Open a company and press the bookmark.'
                        : 'Widen the search or clear a filter.'
                    }
                    action={
                      filtersOn ? (
                        <Button size="sm" variant="secondary" onClick={clearAll}>
                          Clear filters
                        </Button>
                      ) : undefined
                    }
                  />
                )}
              </div>

              <div
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  boxShadow: 'inset 0 1px 0 var(--border-hairline)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  flex: '0 0 auto',
                }}
              >
                <Icon name="download" size={15} color="var(--text-muted)" />
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', flex: 1 }}>
                  Export this view ({count(visible.length)})
                </span>
                <Button size="sm" variant="secondary" onClick={exportView} disabled={!visible.length}>
                  CSV
                </Button>
              </div>
            </section>

            <div className="wm-map" style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <LiveMap points={visible} selected={selected} onSelect={(id) => patch({ id })} command={command} />

              <div
                style={{
                  position: 'absolute',
                  left: 'var(--space-4)',
                  bottom: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                  zIndex: 10,
                }}
              >
                <IconButton name="plus" label="Zoom in" onClick={() => setCommand({ type: 'in', nonce: Date.now() })} />
                <IconButton name="minus" label="Zoom out" onClick={() => setCommand({ type: 'out', nonce: Date.now() })} />
                <IconButton name="compass" label="Reset the view" onClick={() => setCommand({ type: 'reset', nonce: Date.now() })} />
              </div>

              {/* The key, which is now about layers rather than sectors. */}
              <div
                className="ds-overlay wm-legend"
                style={{
                  position: 'absolute',
                  right: 'var(--space-4)',
                  bottom: 'var(--space-4)',
                  zIndex: 10,
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-hairline), var(--shadow-md)',
                  padding: '12px 14px',
                  display: 'grid',
                  gap: 8,
                  minWidth: 168,
                }}
              >
                <span className="wm-label">On the map</span>
                {ALL_LAYERS.filter((l) => activeLayers.includes(l)).map((l) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: l === 'companies' ? '50% 50% 50% 2px' : 4,
                        transform: l === 'companies' ? 'rotate(45deg)' : undefined,
                        background: LAYER_COLOR[l],
                      }}
                    />
                    <span style={{ font: 'var(--type-body-sm)', flex: 1 }}>{LAYER_LABEL[l]}</span>
                    <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
                      {byLayer[l].length}
                    </span>
                  </div>
                ))}
              </div>

              {chosen ? (
                <div
                  style={{
                    position: 'absolute',
                    right: 'var(--space-4)',
                    top: 'var(--space-4)',
                    width: 300,
                    maxWidth: 'calc(100% - var(--space-8))',
                    background: 'var(--surface-card)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-panel)',
                    overflow: 'hidden',
                    zIndex: 30,
                  }}
                >
                  <div style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <span className="wm-label" style={{ color: chosen.color }}>
                          {LAYER_LABEL[chosen.layer].replace(/s$/, '')}
                        </span>
                        <h2 style={{ font: 'var(--type-h3)', marginTop: 2 }}>{chosen.name}</h2>
                      </div>
                      <IconButton name="x" label="Close" size="sm" variant="ghost" onClick={() => patch({ id: null })} />
                    </div>
                    <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', margin: 0 }}>{chosen.blurb}</p>
                    <p className="wm-data" style={{ color: 'var(--text-muted)', margin: 0 }}>
                      {chosen.meta}
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      {chosen.href ? (
                        chosen.href.startsWith('http') ? (
                          <a href={chosen.href} rel="noopener" className="ds-btn ds-btn--primary ds-btn--sm ds-btn--full">
                            Open
                          </a>
                        ) : (
                          <ButtonLink href={chosen.href} size="sm" fullWidth>
                            {chosen.layer === 'companies' ? 'View profile' : 'Details'}
                          </ButtonLink>
                        )
                      ) : null}
                      {chosen.layer === 'companies' ? (
                        <Tooltip label={isSaved(chosen.id) ? 'Saved' : 'Save'}>
                          <IconButton
                            name="bookmark"
                            label={isSaved(chosen.id) ? `Remove ${chosen.name} from saved` : `Save ${chosen.name}`}
                            size="sm"
                            active={isSaved(chosen.id)}
                            onClick={() => {
                              toggleSaved(chosen.id);
                              setToast(isSaved(chosen.id) ? `Removed ${chosen.name}` : `Saved ${chosen.name}`);
                            }}
                          />
                        </Tooltip>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {toast ? (
        <div style={{ position: 'fixed', left: 'var(--space-4)', bottom: 'var(--space-4)', zIndex: 70 }}>
          <Toast tone="info" title={toast} onClose={() => setToast(null)} />
        </div>
      ) : null}

      <Link href="/" style={{ display: 'none' }} aria-hidden="true" />
    </div>
  );
}
