import type { CSSProperties, ReactNode } from 'react';

export interface TagProps {
  children: ReactNode;
  /** Sector hue. Pill radius is reserved for chips and tags — nowhere else. */
  color?: string;
  style?: CSSProperties;
}

/** Descriptive, non-interactive label: sector, stage, location. */
export function Tag({ children, color, style }: TagProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 9px',
        borderRadius: 'var(--radius-pill)',
        background: 'var(--surface-card)',
        boxShadow: 'inset 0 0 0 1px var(--border-hairline)',
        font: 'var(--type-body-sm)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-secondary)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {color ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flex: '0 0 auto' }} /> : null}
      {children}
    </span>
  );
}
