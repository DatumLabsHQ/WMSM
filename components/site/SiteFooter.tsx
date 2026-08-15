import Link from 'next/link';
import { fullDate } from '@/lib/format';

const LINKS: [string, string][] = [
  ['Method', '/method'],
  ['Jobs', '/jobs'],
  ['Funding', '/funding'],
  ['Add your startup', '/add'],
];

/** Two lines. The reference keeps its footer almost invisible and so does this. */
export function SiteFooter({ refreshedAt }: { refreshedAt?: string }) {
  return (
    <footer style={{ padding: 'var(--space-14) var(--space-6) var(--space-18)' }}>
      <div
        style={{
          maxWidth: 'var(--page-max)',
          margin: '0 auto',
          display: 'grid',
          justifyItems: 'center',
          gap: 'var(--space-4)',
          textAlign: 'center',
        }}
      >
        <nav aria-label="Footer" style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap', justifyContent: 'center' }}>
          {LINKS.map(([label, href]) => (
            <Link key={label} href={href} style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)' }}>
              {label}
            </Link>
          ))}
        </nav>
        <p style={{ font: 'var(--type-data)', color: 'var(--text-muted)', margin: 0 }}>
          An independent, human-checked map of the region&rsquo;s startups. Free to browse, free to be listed.
        </p>

        {/* Co-branding. Stated plainly rather than hidden, because the map's pitch is
            independence and the reader is owed the relationship up front. */}
        <p style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--type-body-sm)', color: 'var(--text-secondary)', margin: 0 }}>
          <span
            aria-hidden="true"
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: 'var(--gradient-brand)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--paper-100)',
              font: 'var(--weight-bold) 9px/1 var(--font-display)',
            }}
          >
            D
          </span>
          Built and maintained by{' '}
          <a href="https://datumlab.xyz" rel="noopener" style={{ color: 'var(--text-link)' }}>
            Datum Labs
          </a>
        </p>
        <p style={{ font: 'var(--type-data)', color: 'var(--ink-300)', margin: 0 }}>
          © {new Date().getUTCFullYear()} West Midlands Startup Map
          {refreshedAt ? ` · Last movement recorded ${fullDate(new Date(refreshedAt))}` : ''}
        </p>
      </div>
    </footer>
  );
}
