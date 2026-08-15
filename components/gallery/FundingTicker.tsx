import Link from 'next/link';
import { money, shortDate } from '@/lib/format';
import type { RoundView } from '@/lib/queries';

/**
 * The recent-raises strip. Doubled so the marquee can loop seamlessly; the copy
 * is aria-hidden so a screen reader hears each raise once. Pauses on hover and
 * stops entirely under prefers-reduced-motion.
 */
export function FundingTicker({ rounds }: { rounds: RoundView[] }) {
  if (!rounds.length) return null;

  const item = (r: RoundView, cloned: boolean) => (
    <Link
      key={`${r.id}${cloned ? '-clone' : ''}`}
      href={`/company/${r.companySlug}#funding`}
      tabIndex={cloned ? -1 : undefined}
      aria-hidden={cloned || undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 14px',
        borderRadius: 'var(--radius-pill)',
        background: 'var(--surface-card)',
        boxShadow: 'inset 0 0 0 1px var(--border-hairline)',
        font: 'var(--type-body-sm)',
        color: 'var(--text-secondary)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>{r.companyName}</span>
      <span style={{ color: 'var(--ink-300)' }}>·</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {money(r.amountGbp)} {r.stage}
      </span>
      <span style={{ color: 'var(--ink-300)' }}>·</span>
      <span style={{ color: 'var(--text-muted)' }}>{shortDate(new Date(r.announced))}</span>
    </Link>
  );

  return (
    <div className="wm-ticker" aria-label="Recent funding rounds">
      <div className="wm-ticker__track">
        {rounds.map((r) => item(r, false))}
        {rounds.map((r) => item(r, true))}
      </div>
    </div>
  );
}
