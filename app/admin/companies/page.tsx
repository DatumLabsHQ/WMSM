import { Badge } from '@/components/ds/Badge';
import { Card } from '@/components/ds/Card';
import { prisma } from '@/lib/db';
import { findCompanyLogo, fixCompanyLocation, runGeocodeBackfill, runLogoBackfill, setCompanyLogo } from '../actions';
import { count } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminCompanies() {
  const [companies, withLogo, geocoded] = await Promise.all([
    prisma.company.findMany({
      where: { status: 'published' },
      orderBy: [{ logoUrl: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true, website: true, logoUrl: true, geocodedAt: true, postcode: true, locality: true },
    }),
    prisma.company.count({ where: { status: 'published', NOT: { logoUrl: null } } }),
    prisma.company.count({ where: { status: 'published', NOT: { geocodedAt: null } } }),
  ]);

  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
      <div>
        <h1 style={{ font: 'var(--type-h1)' }}>Companies</h1>
        <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', marginTop: 8 }}>
          {count(withLogo)} of {count(companies.length)} have a real logo · {count(geocoded)} have a resolved postcode. Everything
          else falls back to a generated tile and its seeded point.
        </p>
      </div>

      <Card padding="var(--space-5)" elevation="hairline">
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <form action={runLogoBackfill}>
            <button type="submit" className="ds-btn ds-btn--secondary ds-btn--base">
              Find logos (30 at a time)
            </button>
          </form>
          <form action={runGeocodeBackfill}>
            <button type="submit" className="ds-btn ds-btn--secondary ds-btn--base">
              Resolve postcodes
            </button>
          </form>
        </div>
        <p className="wm-data" style={{ color: 'var(--text-muted)', margin: 'var(--space-3) 0 0' }}>
          Logo discovery reads the company&rsquo;s own site for an apple-touch-icon and stores the URL — we never rehost anyone&rsquo;s
          mark. Both jobs also run nightly from <code>/api/cron/daily</code>.
        </p>
      </Card>

      <Card padding="var(--space-5)" elevation="hairline">
        {companies.map((c) => (
          <div key={c.id} className="ds-row" style={{ alignItems: 'flex-start' }}>
            <span
              style={{
                width: 40,
                height: 40,
                flex: '0 0 auto',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-sunken)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {c.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.logoUrl} alt="" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
              ) : (
                <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
                  —
                </span>
              )}
            </span>

            <span style={{ flex: 1, minWidth: 0, display: 'grid', gap: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ font: 'var(--type-ui)' }}>{c.name}</span>
                {c.geocodedAt ? <Badge tone="success">Located</Badge> : <Badge tone="warning">Seeded point</Badge>}
              </span>
              <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
                {c.locality}, {c.postcode} · {c.website ?? 'no website'}
              </span>
              <form action={setCompanyLogo} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <input type="hidden" name="id" value={c.id} />
                <input
                  name="logoUrl"
                  defaultValue={c.logoUrl ?? ''}
                  placeholder="https://…/logo.png — leave empty for the generated tile"
                  className="ds-field__input"
                  style={{
                    flex: 1,
                    minWidth: 220,
                    padding: '7px 12px',
                    boxShadow: 'inset 0 0 0 1px var(--border-hairline)',
                    borderRadius: 'var(--radius-pill)',
                  }}
                />
                <button type="submit" className="ds-btn ds-btn--secondary ds-btn--sm">
                  Save
                </button>
              </form>
            </span>

            <span style={{ display: 'grid', gap: 6 }}>
              <form action={findCompanyLogo}>
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--full" disabled={!c.website}>
                  Find logo
                </button>
              </form>
              <form action={fixCompanyLocation}>
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--full">
                  Fix location
                </button>
              </form>
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
