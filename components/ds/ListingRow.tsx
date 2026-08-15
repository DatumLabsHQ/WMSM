import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export interface ListingRowProps {
  icon?: IconName;
  iconTone?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Printed as "a  ·  b  ·  c" in mono. */
  meta?: string[];
  trailing?: ReactNode;
  href?: string;
  style?: CSSProperties;
}

function Body({ icon = 'briefcase', iconTone = 'var(--route-500)', title, subtitle, meta = [] }: ListingRowProps) {
  return (
    <>
      <span className="ds-row__glyph">
        <Icon name={icon} size={17} color={iconTone} />
      </span>
      <span style={{ display: 'grid', gap: 3, flex: 1, minWidth: 0 }}>
        <span style={{ font: 'var(--weight-medium) var(--text-base)/1.3 var(--font-body)', color: 'var(--text-primary)' }}>{title}</span>
        {subtitle ? <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)' }}>{subtitle}</span> : null}
        {meta.length ? (
          <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
            {meta.join('  ·  ')}
          </span>
        ) : null}
      </span>
    </>
  );
}

/** One row in a job, event, funding or perk feed. */
export function ListingRow(props: ListingRowProps) {
  const { trailing, href, style } = props;

  if (href) {
    return (
      <div className="ds-row ds-row--interactive" style={style}>
        <Link
          href={href}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flex: 1, minWidth: 0, borderBottom: 0, color: 'inherit' }}
        >
          <Body {...props} />
        </Link>
        {trailing}
      </div>
    );
  }

  return (
    <div className="ds-row" style={style}>
      <Body {...props} />
      {trailing}
    </div>
  );
}
