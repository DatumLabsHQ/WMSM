import type { CSSProperties, ReactNode } from 'react';

export interface StatTileProps {
  value: ReactNode;
  label: string;
  delta?: string;
  deltaTone?: 'success' | 'danger' | 'muted';
  align?: 'left' | 'center' | 'right';
  /** Display size drops on dense grids; the hero and board keep 3xl. */
  size?: 'base' | 'sm';
  style?: CSSProperties;
}

/** Big-number tile for ecosystem stats. Tabular numerals, always. */
export function StatTile({ value, label, delta, deltaTone = 'success', align = 'left', size = 'base', style }: StatTileProps) {
  const tone =
    deltaTone === 'danger' ? 'var(--status-danger)' : deltaTone === 'muted' ? 'var(--text-muted)' : 'var(--status-success)';
  return (
    <div style={{ display: 'grid', gap: 4, textAlign: align, ...style }}>
      <div
        style={{
          font: `var(--weight-bold) ${size === 'sm' ? 'var(--text-2xl)' : 'var(--text-3xl)'}/1.02 var(--font-display)`,
          letterSpacing: 'var(--tracking-display)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div className="wm-label">{label}</div>
      {delta ? (
        <div className="wm-data" style={{ color: tone }}>
          {delta}
        </div>
      ) : null}
    </div>
  );
}
