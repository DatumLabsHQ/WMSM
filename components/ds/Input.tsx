import type { CSSProperties, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

type Size = 'sm' | 'base' | 'lg';

interface Common {
  icon?: IconName;
  size?: Size;
  invalid?: boolean;
  /** Fields sitting on an ink surface (header search, digest capture). */
  inverse?: boolean;
  className?: string;
  wrapStyle?: CSSProperties;
}

export type InputProps = Common & Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'className'>;

function wrapCls({ size = 'base', invalid, inverse, className }: Common, extra = '') {
  return ['ds-field', `ds-field--${size}`, invalid ? 'ds-field--invalid' : '', inverse ? 'ds-field--inverse' : '', extra, className ?? '']
    .filter(Boolean)
    .join(' ');
}

/** Single-line text field. The search variant carries a leading glyph. */
export function Input({ icon, size, invalid, inverse, className, wrapStyle, ...rest }: InputProps) {
  return (
    <div className={wrapCls({ size, invalid, inverse, className })} style={wrapStyle}>
      {icon ? <Icon name={icon} size={16} /> : null}
      <input className="ds-field__input" aria-invalid={invalid || undefined} {...rest} />
    </div>
  );
}

export type TextareaProps = Common & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>;

export function Textarea({ invalid, inverse, className, wrapStyle, rows = 4, ...rest }: TextareaProps) {
  return (
    <div className={wrapCls({ invalid, inverse, className }, 'ds-field--textarea')} style={wrapStyle}>
      <textarea className="ds-field__input" rows={rows} aria-invalid={invalid || undefined} {...rest} />
    </div>
  );
}
