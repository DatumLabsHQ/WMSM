import { Badge } from '@/components/ds/Badge';
import { Card } from '@/components/ds/Card';
import { EmptyState } from '@/components/ds/EmptyState';
import { PasteImporter } from '@/components/admin/PasteImporter';
import { prisma } from '@/lib/db';
import { acceptCandidate, rejectBelowScore, rejectCandidate, runEnrichment, runGtrImport } from './actions';
import { count, fullDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

const STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Bootstrapped'];

function scoreTone(score: number) {
  if (score >= 70) return 'success' as const;
  if (score >= 45) return 'warning' as const;
  return 'neutral' as const;
}

export default async function AdminCandidates({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const { source } = await searchParams;

  const [candidates, sectors, counts] = await Promise.all([
    prisma.candidate.findMany({
      where: { status: 'new', ...(source ? { source } : {}) },
      orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
      take: 60,
    }),
    prisma.sector.findMany({ orderBy: { sortOrder: 'asc' } }),
    Promise.all([
      prisma.candidate.count({ where: { status: 'new' } }),
      prisma.candidate.count({ where: { status: 'accepted' } }),
      prisma.candidate.count({ where: { status: 'rejected' } }),
    ]),
  ]);

  const [waiting, accepted, rejected] = counts;

  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ font: 'var(--type-h1)' }}>Candidates</h1>
        <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', marginTop: 8 }}>
          {count(waiting)} waiting · {count(accepted)} accepted · {count(rejected)} rejected. Score orders the queue and decides
          nothing — it only knows what a machine can check.
        </p>
      </div>

      <PasteImporter />

      <Card padding="var(--space-5)" elevation="hairline">
        <h2 style={{ font: 'var(--type-h2)', marginBottom: 8 }}>The other two importers</h2>
        <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)' }}>
          <strong>UKRI Gateway to Research</strong> finds companies here that have won public R&amp;D funding — the strongest
          available signal that a company is real and operating. Free, no key.
        </p>
        <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)' }}>
          <strong>Reading their websites</strong> pulls each candidate&rsquo;s own meta description, so you edit a line rather
          than write one — and tells you whether the site still responds, which is the strongest cheap signal that a Companies
          House row is a shell. It also runs nightly.
        </p>
        <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)' }}>
          <strong>Companies House</strong> is the widest net and runs from the command line, because the file is 2.6GB:
        </p>
        <pre
          style={{
            font: 'var(--weight-regular) 12px/1.6 var(--font-mono)',
            background: 'var(--surface-sunken)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            margin: '0 0 var(--space-4)',
            overflowX: 'auto',
            color: 'var(--ink-700)',
          }}
        >
          <code>{`curl -O https://download.companieshouse.gov.uk/BasicCompanyDataAsOneFile-2026-08-01.zip
unzip BasicCompanyDataAsOneFile-2026-08-01.zip
npm run import:ch -- BasicCompanyDataAsOneFile-2026-08-01.csv`}</code>
        </pre>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <form action={runGtrImport}>
            <button type="submit" className="ds-btn ds-btn--secondary ds-btn--base">
              Import from UKRI
            </button>
          </form>
          <form action={runEnrichment}>
            <button type="submit" className="ds-btn ds-btn--secondary ds-btn--base">
              Read their websites (60)
            </button>
          </form>
          <form action={rejectBelowScore} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="hidden" name="threshold" value="40" />
            <button type="submit" className="ds-btn ds-btn--ghost ds-btn--base">
              Clear everything scoring under 40
            </button>
          </form>
        </div>
      </Card>

      {candidates.length ? (
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {candidates.map((c) => (
            <Card key={c.id} padding="var(--space-5)" elevation="hairline">
              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <h3 style={{ font: 'var(--type-h3)' }}>{c.name}</h3>
                    <Badge tone={scoreTone(c.score)}>{c.score}</Badge>
                    <Badge tone="neutral">{c.source}</Badge>
                    {c.websiteOk === false ? <Badge tone="danger">Site down</Badge> : null}
                    {c.websiteOk === true ? <Badge tone="success">Site live</Badge> : null}
                  </div>
                  {c.note ? (
                    <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', margin: '0 0 6px' }}>{c.note}</p>
                  ) : null}
                  <p className="wm-data" style={{ color: 'var(--text-muted)', margin: 0 }}>
                    {c.postcode}
                    {c.locality ? ` · ${c.locality}` : ''}
                    {c.website ? ` · ${c.website}` : ' · no website'}
                    {c.companyNumber ? ` · ${c.companyNumber}` : ''}
                    {c.incorporated ? ` · inc. ${fullDate(c.incorporated)}` : ''}
                  </p>
                  {c.signals ? (
                    <p className="wm-data" style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>
                      {c.signals}
                    </p>
                  ) : null}
                  <p className="wm-data" style={{ margin: '8px 0 0' }}>
                    {c.website ? (
                      <a href={`https://${c.website}`} rel="nofollow noopener">
                        Open site ↗
                      </a>
                    ) : null}
                    {c.companyNumber ? (
                      <>
                        {c.website ? ' · ' : ''}
                        <a
                          href={`https://find-and-update.company-information.service.gov.uk/company/${c.companyNumber}`}
                          rel="nofollow noopener"
                        >
                          Companies House ↗
                        </a>
                      </>
                    ) : null}
                  </p>
                </div>

                <form action={acceptCandidate} style={{ display: 'grid', gap: 8, minWidth: 280 }}>
                  <input type="hidden" name="id" value={c.id} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      name="sectorId"
                      defaultValue={c.sectorId ?? ''}
                      required
                      className="ds-select__el"
                      style={{ boxShadow: 'inset 0 0 0 1px var(--border-hairline)', borderRadius: 'var(--radius-pill)', height: 32, padding: '0 12px' }}
                    >
                      <option value="">Sector…</option>
                      {sectors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <select
                      name="stage"
                      defaultValue="Seed"
                      className="ds-select__el"
                      style={{ boxShadow: 'inset 0 0 0 1px var(--border-hairline)', borderRadius: 'var(--radius-pill)', height: 32, padding: '0 12px' }}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    name="blurb"
                    maxLength={140}
                    defaultValue={c.blurb ?? ''}
                    placeholder={c.enrichedAt ? 'Their site said nothing useful — write one line' : 'One line on what they do'}
                    className="ds-field__input"
                    style={{ padding: '7px 12px', boxShadow: 'inset 0 0 0 1px var(--border-hairline)', borderRadius: 'var(--radius-pill)' }}
                  />
                  <button type="submit" className="ds-btn ds-btn--primary ds-btn--sm ds-btn--full">
                    Accept and publish
                  </button>
                </form>

                <div style={{ display: 'grid', gap: 6, alignContent: 'start' }}>
                  <form action={rejectCandidate}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="as" value="rejected" />
                    <button type="submit" className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--full">
                      Reject
                    </button>
                  </form>
                  <form action={rejectCandidate}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="as" value="duplicate" />
                    <button type="submit" className="ds-btn ds-btn--ghost ds-btn--sm ds-btn--full">
                      Duplicate
                    </button>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="search"
          title="No candidates waiting"
          message="Run an importer above, or paste a list. Nothing here is public until you accept it."
        />
      )}
    </div>
  );
}
