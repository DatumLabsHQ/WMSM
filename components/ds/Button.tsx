import Link from 'next/link';
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'inverse';
export type ButtonSize = 'sm' | 'base' | 'lg';

interface CommonProps {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  style?: CSSProperties;
}

export type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: undefined };

export type ButtonLinkProps = CommonProps & { href: string; prefetch?: boolean; target?: string; rel?: string };

function classes({ variant = 'primary', size = 'base', fullWidth, className }: CommonProps) {
  return ['ds-btn', `ds-btn--${variant}`, `ds-btn--${size}`, fullWidth ? 'ds-btn--full' : '', className ?? '']
    .filter(Boolean)
    .join(' ');
}

/** Primary action control. One primary per view; secondary and ghost carry the rest. */
export function Button({ children, variant, size, iconLeft, iconRight, fullWidth, className, style, ...rest }: ButtonProps) {
  return (
    <button className={classes({ variant, size, fullWidth, className })} style={style} {...rest}>
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}

/** Same chrome, but it navigates. Used for every CTA that is really a link. */
export function ButtonLink({ children, variant, size, iconLeft, iconRight, fullWidth, className, style, href, ...rest }: ButtonLinkProps) {
  return (
    <Link href={href} className={classes({ variant, size, fullWidth, className })} style={style} {...rest}>
      {iconLeft}
      {children}
      {iconRight}
    </Link>
  );
}
