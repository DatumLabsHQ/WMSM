import type { CSSProperties, InputHTMLAttributes } from 'react';

interface Common {
  label?: string;
  className?: string;
  wrapStyle?: CSSProperties;
}

export type SwitchProps = Common & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>;

/** Binary toggle for map layers and notification settings. */
export function Switch({ label, className, wrapStyle, disabled, ...rest }: SwitchProps) {
  return (
    <label className={['ds-switch', disabled ? 'ds-switch--disabled' : '', className ?? ''].filter(Boolean).join(' ')} style={wrapStyle}>
      <input type="checkbox" role="switch" className="ds-switch__input" disabled={disabled} aria-label={label ? undefined : 'Toggle'} {...rest} />
      <span className="ds-switch__track" aria-hidden="true">
        <span className="ds-switch__thumb" />
      </span>
      {label ? <span className="ds-switch__label">{label}</span> : null}
    </label>
  );
}
