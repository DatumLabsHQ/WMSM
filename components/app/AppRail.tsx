'use client';

import { Icon, type IconName } from '@/components/ds/Icon';
import { Tooltip } from '@/components/ds/Tooltip';
import { LAYER_COLOR, LAYER_LABEL, type MapLayer } from '@/lib/map-types';

const LAYERS: { key: MapLayer; icon: IconName }[] = [
  { key: 'companies', icon: 'map-pin' },
  { key: 'events', icon: 'calendar' },
  { key: 'spaces', icon: 'building-2' },
];

export interface AppRailProps {
  active: MapLayer[];
  counts: Record<MapLayer, number>;
  onToggle: (layer: MapLayer) => void;
  savedCount: number;
  savedOn: boolean;
  onToggleSaved: () => void;
  onExport: () => void;
}

/**
 * Layer switches, not navigation. Each one turns a set of markers on or off, and
 * the map shows whatever is on — which is the only reading of this rail that makes
 * sense next to a map.
 */
export function AppRail({ active, counts, onToggle, savedCount, savedOn, onToggleSaved, onExport }: AppRailProps) {
  return (
    <nav
      aria-label="Map layers"
      className="wm-rail"
      style={{
        width: 'var(--rail-w)',
        background: 'var(--surface-card)',
        boxShadow: 'inset -1px 0 0 var(--border-hairline)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-3) 0',
        flex: '0 0 auto',
      }}
    >
      {LAYERS.map((l) => {
        const on = active.includes(l.key);
        return (
          <Tooltip key={l.key} label={`${LAYER_LABEL[l.key]} (${counts[l.key]})`} placement="right">
            <button
              type="button"
              aria-pressed={on}
              aria-label={`${on ? 'Hide' : 'Show'} ${LAYER_LABEL[l.key].toLowerCase()} on the map`}
              onClick={() => onToggle(l.key)}
              className="ds-iconbtn ds-iconbtn--base ds-iconbtn--ghost"
              style={{ position: 'relative', color: on ? LAYER_COLOR[l.key] : undefined }}
            >
              <Icon name={l.icon} size={20} />
              {/* A dot in the layer's own colour, so the rail doubles as the map key. */}
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  bottom: 4,
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: on ? LAYER_COLOR[l.key] : 'var(--ink-200)',
                }}
              />
            </button>
          </Tooltip>
        );
      })}

      <span aria-hidden="true" style={{ width: 24, height: 1, background: 'var(--border-hairline)', margin: 'var(--space-2) 0' }} />

      <Tooltip label={savedOn ? 'Showing saved' : `Saved (${savedCount})`} placement="right">
        <button
          type="button"
          aria-label={savedOn ? 'Show all companies' : `Show only saved companies (${savedCount})`}
          aria-pressed={savedOn}
          onClick={onToggleSaved}
          className="ds-iconbtn ds-iconbtn--base ds-iconbtn--ghost"
          style={{ position: 'relative' }}
        >
          <Icon name="bookmark" size={20} />
          {savedCount ? (
            <span
              className="wm-data"
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                minWidth: 15,
                height: 15,
                padding: '0 3px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--fill-primary)',
                color: '#fff',
                fontSize: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {savedCount}
            </span>
          ) : null}
        </button>
      </Tooltip>

      <div style={{ marginTop: 'auto' }}>
        <Tooltip label="Download this view" placement="right">
          <button type="button" aria-label="Download this view as CSV" onClick={onExport} className="ds-iconbtn ds-iconbtn--base ds-iconbtn--ghost">
            <Icon name="download" size={20} />
          </button>
        </Tooltip>
      </div>
    </nav>
  );
}
