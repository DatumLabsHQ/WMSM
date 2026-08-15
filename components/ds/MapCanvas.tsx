import type { CSSProperties, ReactNode } from 'react';

export interface MapCanvasProps {
  children?: ReactNode;
  height?: number | string;
  style?: CSSProperties;
}

/**
 * Stand-in for the live tile layer: paper base, hairline grid, canal and motorway
 * lines, water. Used for cards, thumbnails and anywhere a real map would be noise.
 * Never ship it over a real provider — the explorer uses LiveMap.
 */
export function MapCanvas({ children, height = '100%', style }: MapCanvasProps) {
  return (
    <div className="wm-grid-paper" style={{ position: 'relative', height, width: '100%', overflow: 'hidden', ...style }}>
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0 }}
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <path d="M-5 62 C 20 58, 34 74, 58 68 S 92 58, 105 64" fill="none" stroke="var(--surface-water)" strokeWidth="2.4" />
        <path d="M-5 30 C 22 34, 40 18, 66 26 S 96 40, 105 34" fill="none" stroke="rgba(3,7,45,.16)" strokeWidth="0.9" />
        <path d="M12 -5 L 34 105" fill="none" stroke="rgba(74,108,247,.34)" strokeWidth="1.1" />
        <path d="M-5 84 L 105 76" fill="none" stroke="rgba(3,7,45,.12)" strokeWidth="0.8" />
        <circle cx="52" cy="46" r="16" fill="rgba(74,108,247,.06)" stroke="rgba(74,108,247,.22)" strokeWidth="0.4" />
      </svg>
      {children}
    </div>
  );
}
