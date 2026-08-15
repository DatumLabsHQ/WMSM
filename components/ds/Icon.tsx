import type { CSSProperties } from 'react';
import { ICONS, type IconName } from '@/lib/icons.generated';

export type { IconName };

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Give a title only when the glyph carries meaning nothing else on screen carries. */
  title?: string;
  style?: CSSProperties;
  className?: string;
}

/**
 * Lucide glyph, inlined at build time so it inherits currentColor and the 1.75 stroke.
 * Decorative by default — icons that repeat a visible label stay out of the a11y tree.
 */
export function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, title, style, className }: IconProps) {
  const glyph = ICONS[name];
  if (!glyph) return null;
  const markup = title ? `<title>${title}</title>${glyph}` : glyph;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      className={className}
      style={{ flex: '0 0 auto', display: 'block', ...style }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
