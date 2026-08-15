'use client';

import type { CSSProperties } from 'react';
import { Icon, type IconName } from './Icon';

export interface LegendItem {
  label: string;
  color: string;
  icon?: IconName;
  count?: number;
}

export interface SectorLegendProps {
  items: LegendItem[];
  /** Empty means "all on" — the map shows everything until a sector is picked. */
  value?: string[];
  onToggle?: (label: string) => void;
  title?: string;
  className?: string;
  style?: CSSProperties;
}

/** Map key. Mirrors the sector colour tokens exactly. */
export function SectorLegend({ items, value = [], onToggle, title = 'Sectors', className, style }: SectorLegendProps) {
  return (
    <div
      className={['ds-overlay', className ?? ''].filter(Boolean).join(' ')}
      style={{
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-hairline), var(--shadow-md)',
        padding: '12px 14px',
        display: 'grid',
        gap: 8,
        ...style,
      }}
    >
      <span className="wm-label">{title}</span>
      {items.map((it) => {
        const on = value.length === 0 || value.includes(it.label);
        const content = (
          <>
            {it.icon ? (
              <Icon name={it.icon} size={14} color={it.color} />
            ) : (
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: it.color, flex: '0 0 auto' }} />
            )}
            <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-primary)', flex: 1, textAlign: 'left' }}>{it.label}</span>
            {it.count != null ? (
              <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
                {it.count.toLocaleString('en-GB')}
              </span>
            ) : null}
          </>
        );
        const shared: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, opacity: on ? 1 : 0.4 };
        return onToggle ? (
          <button
            key={it.label}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(it.label)}
            style={{ ...shared, border: 0, background: 'transparent', padding: 0, cursor: 'pointer', width: '100%' }}
          >
            {content}
          </button>
        ) : (
          <div key={it.label} style={shared}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
