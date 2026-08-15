'use client';

import { useEffect, type CSSProperties } from 'react';
import { Icon, type IconName } from './Icon';

export type ToastTone = 'success' | 'danger' | 'info';

const tones: Record<ToastTone, string> = {
  success: 'var(--status-success)',
  danger: 'var(--status-danger)',
  info: 'var(--route-500)',
};
const glyphs: Record<ToastTone, IconName> = {
  success: 'circle-check',
  danger: 'circle-alert',
  info: 'info',
};

export interface ToastProps {
  tone?: ToastTone;
  title: string;
  message?: string;
  onClose?: () => void;
  /** Auto-dismiss after this many ms. Omit to keep it until dismissed. */
  duration?: number;
  style?: CSSProperties;
}

/** Transient confirmation, bottom-left of the app frame. */
export function Toast({ tone = 'success', title, message, onClose, duration = 6000, style }: ToastProps) {
  useEffect(() => {
    if (!onClose || !duration) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div className="ds-toast" role="status" aria-live="polite" style={style}>
      <Icon name={glyphs[tone]} size={18} color={tones[tone]} />
      <div style={{ display: 'grid', gap: 2, flex: 1 }}>
        <span style={{ font: 'var(--type-ui)' }}>{title}</span>
        {message ? <span style={{ font: 'var(--type-body-sm)', color: 'var(--ink-300)' }}>{message}</span> : null}
      </div>
      {onClose ? (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onClose}
          style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--ink-300)', display: 'flex', padding: 2 }}
        >
          <Icon name="x" size={15} />
        </button>
      ) : null}
    </div>
  );
}
