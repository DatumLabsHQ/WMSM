import Link from 'next/link';
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface Common {
  children: ReactNode;
  selected?: boolean;
  color?: string;
  icon?: IconName;
  count?: number;
  className?: string;
  style?: CSSProperties;
}

export type FilterChipProps = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Common>;

function Body({ children, selected, color, icon, count }: Common) {
  return (
    <>
      {icon ? (
        <Icon name={icon} size={14} color={selected ? 'var(--paper-200)' : color ?? 'var(--text-muted)'} />
      ) : color ? (
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flex: '0 0 auto' }} />
      ) : null}
      {children}
      {count != null ? (
        <span className="wm-data" style={{ opacity: 0.7 }}>
          {count.toLocaleString('en-GB')}
        </span>
      ) : null}
    </>
  );
}

/** Toggleable filter pill above the map. Selected chips turn ink. */
export function FilterChip({ children, selected, color, icon, count, className, style, ...rest }: FilterChipProps) {
  return (
    <button type="button" aria-pressed={!!selected} className={['ds-chip', className ?? ''].filter(Boolean).join(' ')} style={style} {...rest}>
      <Body selected={selected} color={color} icon={icon} count={count}>
        {children}
      </Body>
    </button>
  );
}

/** Chip that navigates — used where the filter is a URL, not local state. */
export function FilterChipLink({ children, selected, color, icon, count, className, style, href, scroll }: Common & { href: string; scroll?: boolean }) {
  return (
    <Link
      href={href}
      scroll={scroll}
      aria-pressed={!!selected}
      role="button"
      className={['ds-chip', className ?? ''].filter(Boolean).join(' ')}
      style={style}
    >
      <Body selected={selected} color={color} icon={icon} count={count}>
        {children}
      </Body>
    </Link>
  );
}
