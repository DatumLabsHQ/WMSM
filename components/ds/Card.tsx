import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

export type Elevation = 'none' | 'hairline' | 'sm' | 'md' | 'panel';

export interface CardProps {
  children: ReactNode;
  padding?: string;
  elevation?: Elevation;
  interactive?: boolean;
  /** Anchor target, for section navigation. */
  id?: string;
  className?: string;
  style?: CSSProperties;
}

/** Surface container: paper, 10px radius, hairline. Elevation only when it floats over the map. */
export function Card({ children, padding = 'var(--space-5)', elevation = 'hairline', interactive, id, className, style }: CardProps) {
  return (
    <div
      id={id}
      className={['ds-card', `ds-card--${elevation}`, interactive ? 'ds-card--interactive' : '', className ?? ''].filter(Boolean).join(' ')}
      style={{ padding, ...style }}
    >
      {children}
    </div>
  );
}

/** A card that is a link — lifts on hover, keeps the whole surface clickable. */
export function CardLink({ children, padding = 'var(--space-5)', elevation = 'hairline', className, style, href }: CardProps & { href: string }) {
  return (
    <Link
      href={href}
      className={['ds-card', `ds-card--${elevation}`, 'ds-card--interactive', className ?? ''].filter(Boolean).join(' ')}
      style={{ padding, display: 'block', ...style }}
    >
      {children}
    </Link>
  );
}
