import Link from 'next/link';
import { Card } from '@/components/ds/Card';
import { EmptyState } from '@/components/ds/EmptyState';
import { prisma } from '@/lib/db';
import { approveSubmission, rejectSubmission, runDraftFundingPosts, runSnapshots, sendDigest } from './actions';
import { count, fullDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

function Stat({ value, label, href }: { value: number; label: string; href?: string }) {
  const inner = (
    <Card padding="var(--space-5)" elevation="hairline">
      <div style={{ font: 'var(--weight-bold) var(--text-2xl)/1 var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
        {count(value)}
      </div>
      <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
    </Card>
  );
  return href ? (
    <Link href={href} style={{ color: 'inherit' }}>
      {inner}
    </Link>
  ) : (
    inner
  );
}

export default async function AdminQueue() {
  const [submissions, claims, intros, stats] = await Promise.all([
    prisma.submission.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'asc' } }),
    prisma.claimRequest.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.introRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    Promise.all([
      prisma.company.count({ where: { status: 'published' } }),
      prisma.subscriber.count({ where: { status: 'confirmed' } }),
      prisma.subscriber.count({ where: { status: 'pending' } }),
      prisma.emailMessage.count({ where: { status: 'queued' } }),
      prisma.article.count({ where: { status: 'published' } }),
      prisma.candidate.count({ where: { status: 'new' } }),
    ]),
  ]);

  const [companies, confirmed, pendingSubs, queued, published, candidates] = stats;
  const companyById = new Map(
    (await prisma.company.findMany({ select: { id: true, name: true, slug: true } })).map((c) => [c.id, c]),
  );

  return (
    <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-3)' }}>
        <Stat value={companies} label="Companies live" />
        <Stat value={published} label="Articles published" href="/admin/articles" />
        <Stat value={confirmed} label="Confirmed subscribers" href="/admin/subscribers" />
        <Stat value={pendingSubs} label="Awaiting confirmation" href="/admin/subscribers" />
        <Stat value={queued} label="Email queued" href="/admin/outbox" />
        <Stat value={candidates} label="Candidates waiting" href="/admin/candidates" />
      </div>

      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <h2 style={{ font: 'var(--type-h2)' }}>Submissions</h2>
          <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
            {count(submissions.length)} waiting
          </span>
        </div>

        {submissions.length ? (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {submissions.map((s) => (
              <Card key={s.id} padding="var(--space-5)" elevation="hairline">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 240, flex: 1 }}>
                    <h3 style={{ font: 'var(--type-h3)' }}>{s.name}</h3>
                    <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', margin: '4px 0 8px' }}>{s.blurb}</p>
                    <p className="wm-data" style={{ color: 'var(--text-muted)', margin: 0 }}>
                      {s.website} · {s.sectorId} · {s.stage} · {s.postcode} · {s.contactName} &lt;{s.contactEmail}&gt; ·{' '}
                      {fullDate(s.createdAt)}
                    </p>
                  </div>
                  <div style={{ display: 'grid', gap: 'var(--space-2)', alignContent: 'start', minWidth: 260 }}>
                    <form action={approveSubmission}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="ds-btn ds-btn--primary ds-btn--sm ds-btn--full">
                        Approve and publish
                      </button>
                    </form>
                    <form action={rejectSubmission} style={{ display: 'grid', gap: 6 }}>
                      <input type="hidden" name="id" value={s.id} />
                      <input name="reason" placeholder="Reason (emailed to them)" className="ds-field__input" style={{ padding: '8px 12px', boxShadow: 'inset 0 0 0 1px var(--border-hairline)', borderRadius: 'var(--radius-pill)' }} />
                      <button type="submit" className="ds-btn ds-btn--secondary ds-btn--sm ds-btn--full">
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
                <p className="wm-data" style={{ color: 'var(--text-muted)', margin: 'var(--space-4) 0 0' }}>
                  Approving resolves the postcode, looks for a logo, publishes the listing and emails them the link. Headcount
                  defaults to 1–10 until someone corrects it.
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon="circle-check" title="Queue is clear" message="Nothing waiting to be reviewed." />
        )}
      </section>

      <section>
        <h2 style={{ font: 'var(--type-h2)', marginBottom: 'var(--space-3)' }}>Claims in flight</h2>
        {claims.length ? (
          <Card padding="var(--space-5)" elevation="hairline">
            {claims.map((c) => {
              const company = companyById.get(c.companyId);
              return (
                <div key={c.id} className="ds-row">
                  <span style={{ flex: 1 }}>
                    <span style={{ font: 'var(--type-ui)' }}>{company?.name ?? c.companyId}</span>
                    <br />
                    <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
                      {c.email} · sent {fullDate(c.createdAt)} · expires {fullDate(c.expiresAt)}
                    </span>
                  </span>
                  <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
                    awaiting click
                  </span>
                </div>
              );
            })}
          </Card>
        ) : (
          <EmptyState icon="circle-check" title="No claims pending" message="Verification links are clicked or expired." />
        )}
      </section>

      <section>
        <h2 style={{ font: 'var(--type-h2)', marginBottom: 'var(--space-3)' }}>Recent intro requests</h2>
        {intros.length ? (
          <Card padding="var(--space-5)" elevation="hairline">
            {intros.map((i) => (
              <div key={i.id} className="ds-row">
                <span style={{ flex: 1 }}>
                  <span style={{ font: 'var(--type-ui)' }}>
                    {i.fromName} → {companyById.get(i.companyId)?.name ?? i.companyId}
                  </span>
                  <br />
                  <span className="wm-data" style={{ color: 'var(--text-muted)' }}>
                    {i.fromEmail} · {fullDate(i.createdAt)}
                  </span>
                  <br />
                  <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)' }}>{i.reason}</span>
                </span>
              </div>
            ))}
          </Card>
        ) : (
          <EmptyState icon="handshake" title="No intro requests yet" message="They appear here as they come in." />
        )}
      </section>

      <section>
        <h2 style={{ font: 'var(--type-h2)', marginBottom: 'var(--space-3)' }}>Weekly digest</h2>
        <Card padding="var(--space-5)" elevation="hairline">
          <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)' }}>
            Builds the last seven days of raises, listings, roles and articles and queues one email per confirmed subscriber.
            Subscribers with nothing new are skipped rather than sent an empty email. Normally this runs from{' '}
            <code>/api/cron/digest</code> on a schedule.
          </p>
          <form action={sendDigest}>
            <button type="submit" className="ds-btn ds-btn--secondary ds-btn--base">
              Build digest now
            </button>
          </form>
        </Card>
      </section>

      <section>
        <h2 style={{ font: 'var(--type-h2)', marginBottom: 'var(--space-3)' }}>Jobs you can run by hand</h2>
        <Card padding="var(--space-5)" elevation="hairline">
          <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)' }}>
            All of these also run nightly from <code>/api/cron/daily</code>. Nothing here publishes anything — the funding job
            writes drafts for you to read.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <form action={runDraftFundingPosts}>
              <button type="submit" className="ds-btn ds-btn--secondary ds-btn--base">
                Draft posts for recent rounds
              </button>
            </form>
            <form action={runSnapshots}>
              <button type="submit" className="ds-btn ds-btn--secondary ds-btn--base">
                Take a snapshot
              </button>
            </form>
          </div>
        </Card>
      </section>
    </div>
  );
}
