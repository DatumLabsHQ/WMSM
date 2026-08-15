import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ds/Badge';
import { Card } from '@/components/ds/Card';
import { EmptyState } from '@/components/ds/EmptyState';
import { Icon } from '@/components/ds/Icon';
import { ListingRow } from '@/components/ds/ListingRow';
import { Tag } from '@/components/ds/Tag';
import { BrandTile } from '@/components/gallery/BrandTile';
import { GalleryCard } from '@/components/gallery/GalleryCard';
import { ClaimDialog } from '@/components/company/ClaimDialog';
import { IntroCard } from '@/components/company/IntroCard';
import { getCompany, getCompanySlugs, getSimilarCompanies } from '@/lib/queries';
import { getArticlesForCompany } from '@/lib/news';
import { getMomentum } from '@/lib/snapshots';
import { ArticleCard } from '@/components/news/ArticleCard';
import { EmbedSnippet } from '@/components/company/EmbedSnippet';
import { siteUrl } from '@/lib/email/templates';
import { count, fullDate, money, plural, shortDate, sinceLabel } from '@/lib/format';

export async function generateStaticParams() {
  const slugs = await getCompanySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) return { title: 'Listing not found' };
  return {
    title: company.name,
    description: `${company.blurb}. ${company.sector} in ${company.location}, founded ${company.founded}.`,
    alternates: { canonical: `/company/${company.slug}` },
  };
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'grid', gap: 3, textAlign: 'center' }}>
      <span
        style={{
          font: 'var(--weight-bold) var(--text-2xl)/1.05 var(--font-display)',
          letterSpacing: 'var(--tracking-display)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
      <span style={{ font: 'var(--type-data)', color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) notFound();

  const [similar, coverage, momentum] = await Promise.all([
    getSimilarCompanies(slug, 3),
    getArticlesForCompany(slug),
    getMomentum(company.id),
  ]);
  const totalRaised = company.rounds.reduce((n, r) => n + r.amountGbp, 0);
  const lastRound = company.rounds[0];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 'var(--space-6) var(--space-6) var(--space-24)' }}>
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          color: 'var(--text-muted)',
          font: 'var(--type-body-sm)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <Icon name="chevron-left" size={15} />
        All startups
      </Link>

      {/* --- The tile, full width, exactly as it appears in the gallery --- */}
      <div
        style={{
          position: 'relative',
          containerType: 'inline-size',
          aspectRatio: '2 / 1',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-tile), inset 0 0 0 1px rgba(3,7,45,.06)',
        }}
      >
        <BrandTile name={company.name} slug={company.slug} color={company.sectorColor} logoUrl={company.logoUrl} />
      </div>

      {/* --- Identity --- */}
      <div style={{ display: 'grid', gap: 'var(--space-4)', justifyItems: 'center', textAlign: 'center', marginTop: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <h1 style={{ font: 'var(--weight-bold) var(--text-3xl)/1.1 var(--font-display)', letterSpacing: 'var(--tracking-display)' }}>
            {company.name}
          </h1>
          {company.verified ? (
            <Badge tone="info" dot>
              Verified
            </Badge>
          ) : (
            <Badge tone="warning">Unclaimed</Badge>
          )}
        </div>

        <p style={{ font: 'var(--type-body)', color: 'var(--text-secondary)', margin: 0, maxWidth: '58ch' }}>
          {company.about ??
            `${company.blurb}. Founded ${company.founded} in ${company.location.split(',')[0]}, part of the West Midlands ${company.sector.toLowerCase()} cluster.`}
        </p>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Tag color={company.sectorColor}>{company.sector}</Tag>
          <Tag>{company.stage}</Tag>
          <Tag>{company.headcount} people</Tag>
          <Tag>Est. {company.founded}</Tag>
          <Tag>{company.authority}</Tag>
          {company.hiring ? <Tag color="var(--moss-500)">{plural(company.jobs.length, 'open role')}</Tag> : null}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'var(--space-1)' }}>
          {company.website ? (
            <a href={`https://${company.website}`} rel="nofollow noopener" className="ds-btn ds-btn--secondary ds-btn--base">
              <Icon name="globe" size={15} />
              {company.website}
              <Icon name="arrow-up-right" size={13} />
            </a>
          ) : null}
          <ClaimDialog slug={company.slug} name={company.name} website={company.website} claimed={company.claimed} />
        </div>
      </div>

      {/* --- Figures --- */}
      <Card padding="var(--space-6)" elevation="hairline" style={{ marginTop: 'var(--space-10)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 'var(--space-5)' }}>
          <Figure value={money(totalRaised)} label="Total raised" />
          <Figure value={company.headcount} label="Headcount" />
          <Figure value={count(company.jobs.length)} label="Open roles" />
          <Figure value={String(company.founded)} label="Founded" />
        </div>
        <p className="wm-data" style={{ color: 'var(--text-muted)', margin: 'var(--space-5) 0 0', textAlign: 'center' }}>
          {lastRound
            ? `Last round: ${lastRound.stage}, ${money(lastRound.amountGbp)}, ${fullDate(new Date(lastRound.announced))}`
            : 'No funding recorded. Bootstrapped, or raised privately and never announced.'}
        </p>

        {/* What moved, rather than only what is true today. */}
        {momentum && !momentum.quiet ? (
          <p
            style={{
              font: 'var(--type-body-sm)',
              color: 'var(--status-success)',
              margin: 'var(--space-3) 0 0',
              textAlign: 'center',
            }}
          >
            {[
              momentum.roles ? `${momentum.roles > 0 ? '+' : ''}${momentum.roles} ${Math.abs(momentum.roles) === 1 ? 'role' : 'roles'}` : null,
              momentum.raised ? `${money(momentum.raised)} raised` : null,
              momentum.headcount ? `${momentum.headcount > 0 ? '+' : ''}${momentum.headcount} people` : null,
            ]
              .filter(Boolean)
              .join(' · ')}{' '}
            <span style={{ color: 'var(--text-muted)' }}>in the last {momentum.days} days</span>
          </p>
        ) : null}
      </Card>

      {/* --- Roles --- */}
      <section id="roles" style={{ marginTop: 'var(--space-8)' }}>
        <Card padding="var(--space-6)" elevation="hairline">
          <h2 style={{ font: 'var(--type-h2)', marginBottom: 'var(--space-4)' }}>Open roles</h2>
          {company.jobs.length ? (
            company.jobs.map((j) => (
              <ListingRow
                key={j.id}
                icon="briefcase"
                title={j.title}
                subtitle={`${j.locality} · ${j.arrangement}`}
                meta={[j.salaryLabel, j.discipline, sinceLabel(new Date(j.postedAt))]}
                trailing={
                  company.website ? (
                    <a href={`https://${company.website}`} rel="nofollow noopener" className="ds-btn ds-btn--secondary ds-btn--sm">
                      Apply
                    </a>
                  ) : null
                }
              />
            ))
          ) : (
            <EmptyState
              icon="briefcase"
              title="Not hiring right now"
              message={`${company.name} has no roles on the board. Claimed listings post them free.`}
            />
          )}
        </Card>
      </section>

      {/* --- Funding --- */}
      <section id="funding" style={{ marginTop: 'var(--space-6)' }}>
        <Card padding="var(--space-6)" elevation="hairline">
          <h2 style={{ font: 'var(--type-h2)', marginBottom: 'var(--space-4)' }}>Funding</h2>
          {company.rounds.length ? (
            company.rounds.map((r) => (
              <ListingRow
                key={r.id}
                icon="banknote"
                iconTone="var(--brass-600)"
                title={`${money(r.amountGbp)} ${r.stage}`}
                subtitle={r.investors}
                meta={[shortDate(new Date(r.announced))]}
              />
            ))
          ) : (
            <EmptyState
              icon="banknote"
              title="No rounds recorded"
              message="If this company has raised, tell us and we will add it with a source."
            />
          )}
        </Card>
      </section>

      {/* --- Where, and who to ask --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
        <Card padding="var(--space-5)" elevation="hairline">
          <span className="wm-label">Where</span>
          <p style={{ font: 'var(--type-body)', margin: '10px 0 12px' }}>
            {company.location.split(',')[0]}, {company.postcode}
          </p>
          <Link href={`/map?company=${company.slug}`} className="ds-btn ds-btn--secondary ds-btn--sm">
            <Icon name="map-pin" size={14} />
            See it on the map
          </Link>
        </Card>

        <IntroCard slug={company.slug} name={company.name} />

        <Card padding="var(--space-5)" elevation="hairline">
          <span className="wm-label">Something wrong?</span>
          <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', margin: '10px 0 12px' }}>
            This listing was compiled by us, not written by the company. Corrections are welcome and free.
          </p>
          <Link href="/method#corrections" className="ds-btn ds-btn--secondary ds-btn--sm">
            Submit a correction
          </Link>
        </Card>
      </div>

      {/* --- Take the roles with you --- */}
      {company.jobs.length ? (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <EmbedSnippet slug={company.slug} name={company.name} origin={siteUrl()} />
        </div>
      ) : null}

      {/* --- Coverage --- */}
      {coverage.length ? (
        <section style={{ marginTop: 'var(--space-8)' }}>
          <h2 style={{ font: 'var(--type-h2)', marginBottom: 'var(--space-4)' }}>What we have written</h2>
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {coverage.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      ) : null}

      {/* --- More like it --- */}
      {similar.length ? (
        <section style={{ marginTop: 'var(--space-18)' }}>
          <h2 style={{ font: 'var(--type-h2)', textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            More {company.sector.toLowerCase()} nearby
          </h2>
          <div className="wm-gallery">
            {similar.map((s) => (
              <GalleryCard key={s.id} company={s} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
