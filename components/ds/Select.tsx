import type { CSSProperties, SelectHTMLAttributes } from 'react';
import { Icon } from './Icon';

export type SelectOption = string | { value: string; label: string };

interface Common {
  options: SelectOption[];
  size?: 'sm' | 'base';
  className?: string;
  wrapStyle?: CSSProperties;
}

export type SelectProps = Common & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'className'>;

/** Native select in design-system chrome. */
export function Select({ options, size = 'base', className, wrapStyle, ...rest }: SelectProps) {
  return (
    <div className={['ds-select', `ds-select--${size}`, className ?? ''].filter(Boolean).join(' ')} style={wrapStyle}>
      <select className="ds-select__el" {...rest}>
        {options.map((o) => {
          const value = typeof o === 'string' ? o : o.value;
          const label = typeof o === 'string' ? o : o.label;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
      <span className="ds-select__chevron">
        <Icon name="chevron-down" size={16} />
      </span>
    </div>
  );
}
