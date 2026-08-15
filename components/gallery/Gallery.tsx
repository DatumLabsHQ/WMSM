'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, ButtonLink } from '@/components/ds/Button';
import { EmptyState } from '@/components/ds/EmptyState';
import { Icon } from '@/components/ds/Icon';
import { Input } from '@/components/ds/Input';
import { GalleryCard } from './GalleryCard';
import { count, plural } from '@/lib/format';
import type { CompanyView, SectorView } from '@/lib/queries';

const PAGE = 12;
const STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Bootstrapped'];

/** Multi-value params travel as comma-separated slugs so a filtered wall is a URL. */
function readList(params: URLSearchParams, key: string): string[] {
  return (params.get(key) ?? '').split(',').filter(Boolean);
}

export function Gallery({ companies, sectors, areas }: { companies: CompanyView[]; sectors: SectorView[]; areas: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shown, setShown] = useState(PAGE);

  const chosenSectors = useMemo(() => readList(params, 'sector'), [params]);
  const chosenStages = useMemo(() => readList(params, 'stage'), [params]);
  const chosenAreas = useMemo(() => readList(params, 'area'), [params]);
  const hiringOnly = params.get('hiring') === '1';
  const query = params.get('q') ?? '';

  const patch = useCallback(
    (next: Record<string, string | null>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === null || v === '') sp.delete(k);
        else sp.set(k, v);
      }
      router.replace(sp.size ? `/?${sp}` : '/', { scroll: false });
      setShown(PAGE);
    },
    [params, router],
  );

  const toggleIn = (key: string, current: string[], value: string) => {
    const next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
    patch({ [key]: next.join(',') });
  };

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return companies.filter((c) => {
      if (chosenSectors.length && !chosenSectors.includes(c.sectorSlug)) return false;
      if (chosenStages.length && !chosenStages.includes(c.stage)) return false;
      if (chosenAreas.length && !chosenAreas.includes(c.authority)) return false;
      if (hiringOnly && !c.hiring) return false;
      if (needle && !`${c.name} ${c.blurb} ${c.sector} ${c.location} ${c.authority}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [companies, chosenSectors, chosenStages, chosenAreas, hiringOnly, query]);

  const activeCount = chosenSectors.length + chosenStages.length + chosenAreas.length + (hiringOnly ? 1 : 0) + (query ? 1 : 0);
  const clearAll = () => patch({ sector: null, stage: null, area: null, hiring: null, q: null });

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const Option = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button type="button" className="ds-chip" aria-pressed={active} onClick={onClick}>
      {label}
    </button>
  );

  return (
    <>
      <div className="wm-page" style={{ paddingBottom: 'var(--space-24)' }}>
        {activeCount ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-8)',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)' }}>
              {plural(filtered.length, 'company', 'companies')} matching
            </span>
            <Button size="sm" variant="ghost" onClick={clearAll}>
              Clear filters
            </Button>
          </div>
        ) : null}

        {filtered.length ? (
          <>
            <div className="wm-gallery">
              {filtered.slice(0, shown).map((c) => (
                <GalleryCard key={c.id} company={c} />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-14)' }}>
              {shown < filtered.length ? (
                <Button variant="secondary" size="lg" onClick={() => setShown((n) => n + PAGE)}>
                  Load more startups
                </Button>
              ) : (
                <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>
                  That is all {count(filtered.length)} of them.
                </span>
              )}
            </div>
          </>
        ) : companies.length === 0 ? (
          /* Nothing filtered out — there is genuinely nothing here yet. Telling a
             first visitor to clear filters they never set is worse than useless. */
          <EmptyState
            icon="map-pin"
            title="No listings yet"
            message="The map is new. Companies appear here as they are checked, one at a time, by a person."
            action={
              <ButtonLink href="/add" style={{ marginTop: 'var(--space-2)' }}>
                Add your startup
              </ButtonLink>
            }
          />
        ) : (
          <EmptyState
            icon="search"
            title="Nothing matches"
            message="No company on the map fits every filter at once. Take one off and try again."
            action={
              <Button size="sm" variant="secondary" onClick={clearAll}>
                Clear filters
              </Button>
            }
          />
        )}
      </div>

      {/* Floating dock — pointless with an empty map */}
      <div className="wm-dock" style={{ display: companies.length ? undefined : 'none' }}>
        <button type="button" className="wm-dock__btn" onClick={() => setSheetOpen(true)} aria-expanded={sheetOpen}>
          <Icon name="sliders-horizontal" size={16} />
          Filter
          {activeCount ? <span className="wm-dock__count">{activeCount}</span> : null}
        </button>
      </div>

      {sheetOpen ? (
        <div className="wm-sheet" onClick={() => setSheetOpen(false)}>
          <div
            className="wm-sheet__panel"
            role="dialog"
            aria-modal="true"
            aria-label="Filter the gallery"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
              <h2 style={{ font: 'var(--type-h2)' }}>Filter</h2>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setSheetOpen(false)}
                className="ds-iconbtn ds-iconbtn--sm ds-iconbtn--ghost"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="wm-sheet__group">
              <Input
                icon="search"
                type="search"
                aria-label="Search companies"
                placeholder="Company, sector or place"
                defaultValue={query}
                onChange={(e) => patch({ q: e.target.value || null })}
              />
            </div>

            <div className="wm-sheet__group">
              <span className="wm-label">Hiring</span>
              <div className="wm-sheet__options">
                <Option label="Hiring now" active={hiringOnly} onClick={() => patch({ hiring: hiringOnly ? null : '1' })} />
              </div>
            </div>

            <div className="wm-sheet__group">
              <span className="wm-label">Stage</span>
              <div className="wm-sheet__options">
                {STAGES.map((s) => (
                  <Option key={s} label={s} active={chosenStages.includes(s)} onClick={() => toggleIn('stage', chosenStages, s)} />
                ))}
              </div>
            </div>

            <div className="wm-sheet__group">
              <span className="wm-label">Sector</span>
              <div className="wm-sheet__options">
                {sectors.map((s) => (
                  <Option
                    key={s.slug}
                    label={`${s.label} ${s.count}`}
                    active={chosenSectors.includes(s.slug)}
                    onClick={() => toggleIn('sector', chosenSectors, s.slug)}
                  />
                ))}
              </div>
            </div>

            <div className="wm-sheet__group" style={{ marginBottom: 0 }}>
              <span className="wm-label">Area</span>
              <div className="wm-sheet__options">
                {areas.map((a) => (
                  <Option key={a} label={a} active={chosenAreas.includes(a)} onClick={() => toggleIn('area', chosenAreas, a)} />
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 'var(--space-3)',
                marginTop: 'var(--space-6)',
                paddingTop: 'var(--space-5)',
                boxShadow: 'inset 0 1px 0 var(--border-hairline)',
              }}
            >
              <Button variant="ghost" onClick={clearAll} disabled={!activeCount}>
                Clear all
              </Button>
              <Button onClick={() => setSheetOpen(false)}>Show {plural(filtered.length, 'company', 'companies')}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
