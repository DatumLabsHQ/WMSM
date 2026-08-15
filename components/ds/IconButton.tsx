import Link from 'next/link';
import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import { Icon, type IconName } from './Icon';

type Size = 'sm' | 'base' | 'lg';

interface Common {
  name: IconName;
  /** Always required: the control has no visible text. */
  label: string;
  size?: Size;
  variant?: 'secondary' | 'ghost';
  active?: boolean;
  className?: string;
  style?: CSSProperties;
}

export type IconButtonProps = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Common | 'aria-label'>;

const glyphSize: Record<Size, number> = { sm: 16, base: 20, lg: 20 };

function cls({ size = 'base', variant = 'secondary', active, className }: Common) {
  return ['ds-iconbtn', `ds-iconbtn--${size}`, variant === 'ghost' ? 'ds-iconbtn--ghost' : '', active ? 'is-active' : '', className ?? '']
    .filter(Boolean)
    .join(' ');
}

/** Square icon-only control for map chrome and toolbars. */
export function IconButton({ name, label, size = 'base', variant, active, className, style, ...rest }: IconButtonProps) {
  return (
    <button aria-label={label} aria-pressed={active} className={cls({ name, label, size, variant, active, className })} style={style} {...rest}>
      <Icon name={name} size={glyphSize[size]} />
    </button>
  );
}

export function IconButtonLink({ name, label, size = 'base', variant, active, className, style, href }: Common & { href: string }) {
  return (
    <Link href={href} aria-label={label} className={cls({ name, label, size, variant, active, className })} style={style}>
      <Icon name={name} size={glyphSize[size]} />
    </Link>
  );
}
