import type { CSSProperties, ReactNode } from 'react';

export interface SectionHeaderProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  /** h2 by default; drop to h3 inside a card that already sits under an h2. */
  as?: 'h2' | 'h3';
  style?: CSSProperties;
}

/** Eyebrow + title + optional action, used above every content block. */
export function SectionHeader({ eyebrow, title, description, action, as: Heading = 'h2', style }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 'var(--space-6)',
        marginBottom: 'var(--space-5)',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      <div style={{ display: 'grid', gap: 6 }}>
        {eyebrow ? (
          <span className="wm-label" style={{ color: 'var(--text-accent)' }}>
            {eyebrow}
          </span>
        ) : null}
        {title ? <Heading style={{ font: 'var(--type-h2)', letterSpacing: 'var(--tracking-heading)' }}>{title}</Heading> : null}
        {description ? (
          <p style={{ font: 'var(--type-body)', color: 'var(--text-secondary)', margin: 0, maxWidth: '58ch' }}>{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
