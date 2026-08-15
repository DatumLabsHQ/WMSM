import type { ReactNode } from 'react';

export interface TooltipProps {
  label: string;
  children: ReactNode;
  placement?: 'top' | 'right';
}

/**
 * Hover label for icon-only controls and map pins. CSS-only, and hidden from
 * screen readers — the control it wraps already carries an accessible name.
 */
export function Tooltip({ label, children, placement = 'top' }: TooltipProps) {
  return (
    <span className={['ds-tip', placement === 'right' ? 'ds-tip--right' : ''].filter(Boolean).join(' ')}>
      {children}
      <span className="ds-tip__label" aria-hidden="true">
        {label}
      </span>
    </span>
  );
}
