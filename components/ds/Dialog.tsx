'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Icon } from './Icon';

export interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  width?: number;
  style?: CSSProperties;
}

/**
 * Centred modal over a scrim. Claim-listing, intro requests, confirmations.
 * Escape closes it, focus moves in on open and back to the opener on close.
 */
export function Dialog({ open, title, description, children, footer, onClose, width = 460, style }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    const focusable = panelRef.current?.querySelector<HTMLElement>(
      'input, textarea, select, button, [href], [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('input, textarea, select, button, [href], [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => !el.hasAttribute('disabled'));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ds-scrim" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="ds-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ width, ...style }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <h3 style={{ font: 'var(--type-h3)' }}>{title}</h3>
            {description ? (
              <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', margin: 0 }}>{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        {children ? <div style={{ marginTop: 'var(--space-5)' }}>{children}</div> : null}
        {footer ? (
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
