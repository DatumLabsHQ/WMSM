import type { CSSProperties, InputHTMLAttributes } from 'react';
import { Icon } from './Icon';

interface Common {
  label: string;
  /** Sector dot, so the filter list reads against the map key. */
  dotColor?: string;
  count?: number;
  className?: string;
  wrapStyle?: CSSProperties;
}

export type CheckboxProps = Common & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>;

/** Checkbox row used throughout filter panels. */
export function Checkbox({ label, dotColor, count, className, wrapStyle, disabled, ...rest }: CheckboxProps) {
  return (
    <label className={['ds-check', disabled ? 'ds-check--disabled' : '', className ?? ''].filter(Boolean).join(' ')} style={wrapStyle}>
      <input type="checkbox" className="ds-check__input" disabled={disabled} {...rest} />
      <span className="ds-check__box" aria-hidden="true">
        <Icon name="check" size={13} />
      </span>
      {dotColor ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flex: '0 0 auto' }} /> : null}
      <span className="ds-check__label">{label}</span>
      {count != null ? (
        <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
          {count.toLocaleString('en-GB')}
        </span>
      ) : null}
    </label>
  );
}
