import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  /** Admit the gap and offer a way out. */
  message?: string;
  action?: ReactNode;
  style?: CSSProperties;
}

/** No-results state for filtered lists and empty saved collections. */
export function EmptyState({ icon = 'search', title, message, action, style }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'grid',
        justifyItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-10) var(--space-6)',
        textAlign: 'center',
        ...style,
      }}
    >
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'var(--surface-sunken)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <Icon name={icon} size={20} />
      </span>
      <span style={{ font: 'var(--type-h3)' }}>{title}</span>
      {message ? <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', maxWidth: '38ch' }}>{message}</span> : null}
      {action}
    </div>
  );
}
