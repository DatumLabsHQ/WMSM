import type { CSSProperties } from 'react';

export interface MapPinProps {
  color?: string;
  /** Name chip under the pin. Shown on the selected pin only. */
  label?: string;
  count?: number;
  selected?: boolean;
  size?: number;
  style?: CSSProperties;
}

/** Teardrop marker. Sector colour fills it; the selected state grows 18% and takes an ink ring. */
export function MapPin({ color = 'var(--route-500)', label, count, selected, size = 28, style }: MapPinProps) {
  const s = selected ? Math.round(size * 1.18) : size;
  return (
    <div
      style={{
        position: 'absolute',
        transform: 'translate(-50%,-100%)',
        display: 'grid',
        justifyItems: 'center',
        gap: 3,
        zIndex: selected ? 20 : 5,
        ...style,
      }}
    >
      <div
        style={{
          width: s,
          height: s,
          borderRadius: '50% 50% 50% 4px',
          transform: 'rotate(45deg)',
          background: color,
          boxShadow: selected ? 'var(--shadow-pin)' : 'var(--shadow-sm)',
          border: `2px solid ${selected ? 'var(--ink-900)' : 'rgba(255,255,255,.9)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {count != null ? (
          <span style={{ transform: 'rotate(-45deg)', color: '#fff', font: 'var(--type-data)', fontWeight: 600 }}>{count}</span>
        ) : null}
      </div>
      {label ? (
        <span
          className="ds-overlay"
          style={{
            padding: '2px 6px',
            borderRadius: 'var(--radius-xs)',
            font: 'var(--type-label)',
            letterSpacing: 'var(--tracking-label)',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
