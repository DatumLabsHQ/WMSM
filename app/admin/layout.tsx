import type { Metadata } from 'next';
import Link from 'next/link';
import '../globals.css';
import '../ds.css';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { logout } from './actions';
import { adminConfigured, isAdmin } from '@/lib/admin-auth';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const NAV: [string, string][] = [
  ['Queue', '/admin'],
  ['Candidates', '/admin/candidates'],
  ['Companies', '/admin/companies'],
  ['Articles', '/admin/articles'],
  ['Outbox', '/admin/outbox'],
  ['Subscribers', '/admin/subscribers'],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!adminConfigured()) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: 'var(--space-24) var(--space-6)' }}>
        <h1 style={{ font: 'var(--type-h1)', marginBottom: 'var(--space-3)' }}>Admin is switched off</h1>
        <p style={{ font: 'var(--type-body)', color: 'var(--text-secondary)' }}>
          Set <code>ADMIN_TOKEN</code> in the environment and restart. Until then there is no way in, which is the correct default
          for a review queue that can publish to a public site.
        </p>
      </div>
    );
  }

  if (!(await isAdmin())) return <AdminLogin />;

  return (
    <div style={{ minHeight: '100dvh' }}>
      <header className="wm-topbar" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
        <Link href="/admin" style={{ font: 'var(--weight-semibold) var(--text-sm)/1 var(--font-display)', color: 'var(--text-primary)' }}>
          Admin
        </Link>
        <nav aria-label="Admin" style={{ display: 'flex', justifyContent: 'center' }}>
          <span className="ds-pillnav">
            {NAV.map(([label, href]) => (
              <Link key={href} href={href} className="ds-pillnav__item">
                {label}
              </Link>
            ))}
          </span>
        </nav>
        <form action={logout}>
          <button type="submit" className="ds-btn ds-btn--secondary ds-btn--sm">
            Sign out
          </button>
        </form>
      </header>
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: 'var(--space-8) var(--space-6) var(--space-24)' }}>{children}</main>
    </div>
  );
}
