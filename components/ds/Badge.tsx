import type { CSSProperties, ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent' | 'ink';

const tones: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: 'var(--surface-sunken)', fg: 'var(--text-secondary)' },
  info: { bg: 'var(--status-info-bg)', fg: 'var(--status-info)' },
  success: { bg: 'var(--status-success-bg)', fg: 'var(--status-success)' },
  warning: { bg: 'var(--status-warning-bg)', fg: 'var(--status-warning)' },
  danger: { bg: 'var(--status-danger-bg)', fg: 'var(--status-danger)' },
  accent: { bg: 'var(--copper-100)', fg: 'var(--copper-700)' },
  ink: { bg: 'var(--ink-900)', fg: 'var(--paper-200)' },
};

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  style?: CSSProperties;
}

/** Status marker — hiring, verified, funded, closed. */
export function Badge({ children, tone = 'neutral', dot, style }: BadgeProps) {
  const t = tones[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px',
        borderRadius: 'var(--radius-sm)',
        background: t.bg,
        color: t.fg,
        font: 'var(--type-label)',
        letterSpacing: 'var(--tracking-label)',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flex: '0 0 auto' }} /> : null}
      {children}
    </span>
  );
}
