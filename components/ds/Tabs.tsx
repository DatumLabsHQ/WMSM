'use client';

import type { CSSProperties } from 'react';

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: (TabItem | string)[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'underline' | 'segmented';
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/** Underlined tab bar for profile sections and dashboard views. */
export function Tabs({ tabs, value, onChange, variant = 'underline', label = 'Sections', className, style }: TabsProps) {
  const items: TabItem[] = tabs.map((t) => (typeof t === 'string' ? { value: t, label: t } : t));
  return (
    <div
      role="tablist"
      aria-label={label}
      className={['ds-tabs', variant === 'segmented' ? 'ds-tabs--segmented' : '', className ?? ''].filter(Boolean).join(' ')}
      style={style}
    >
      {items.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={t.value === value}
          className="ds-tab"
          onClick={() => onChange(t.value)}
        >
          {t.label}
          {t.count != null ? (
            <span className="wm-data" style={{ marginLeft: 6, color: 'var(--text-muted)' }}>
              {t.count.toLocaleString('en-GB')}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
