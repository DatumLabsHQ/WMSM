import Link from 'next/link';

/**
 * No logo was supplied, so no mark was drawn. This is a lettered square — "WM" set
 * in the product's own type on route blue — plus the name in small tight caps.
 * Swap in a real mark and only this file changes.
 */
export function Wordmark({ compact = false, href = '/' as string | null }) {
  const mark = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <span
        aria-hidden="true"
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          background: 'var(--route-600)',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          font: 'var(--weight-bold) 11px/1 var(--font-display)',
          letterSpacing: '-0.03em',
          flex: '0 0 auto',
        }}
      >
        WM
      </span>
      {!compact ? (
        <span
          style={{
            font: 'var(--weight-semibold) var(--text-sm)/1.1 var(--font-display)',
            letterSpacing: '-0.028em',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
          }}
        >
          Startup Map
        </span>
      ) : null}
    </span>
  );

  if (!href) return mark;

  return (
    <Link href={href} aria-label="West Midlands Startup Map — home" style={{ display: 'inline-flex', flex: '0 0 auto' }}>
      {mark}
    </Link>
  );
}
