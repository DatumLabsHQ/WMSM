import Link from 'next/link';
import { GalleryCard } from '@/components/gallery/GalleryCard';
import { EmptyState } from '@/components/ds/EmptyState';
import { siteUrl } from '@/lib/email/templates';
import type { CompanyView } from '@/lib/queries';

export interface HubLink {
  href: string;
  label: string;
  count?: number;
  active?: boolean;
}

/**
 * Every hub page is the same shape: a real heading, a paragraph of real numbers,
 * the wall, then sideways links to sibling hubs. The sideways links are the point —
 * they are how a crawler gets from one landing page to the other forty.
 */
export function HubPage({
  heading,
  intro,
  companies,
  linkGroups,
  children,
}: {
  heading: string;
  intro: string;
  companies: CompanyView[];
  linkGroups: { title: string; links: HubLink[] }[];
  children?: React.ReactNode;
}) {
  const base = siteUrl();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: heading,
    numberOfItems: companies.length,
    itemListElement: companies.slice(0, 30).map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${base}/company/${c.slug}`,
      name: c.name,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="wm-hero">
        <h1>{heading}</h1>
        <p>{intro}</p>
      </section>

      <div className="wm-page" style={{ paddingBottom: 'var(--space-24)' }}>
        {children}

        {companies.length ? (
          <div className="wm-gallery">
            {companies.map((c) => (
              <GalleryCard key={c.id} company={c} />
            ))}
          </div>
        ) : (
          <EmptyState icon="search" title="Nothing here yet" message="As soon as a company fits, it appears on this page." />
        )}

        <div style={{ display: 'grid', gap: 'var(--space-6)', marginTop: 'var(--space-18)' }}>
          {linkGroups.map((group) => (
            <div key={group.title} style={{ display: 'grid', gap: 'var(--space-3)', justifyItems: 'center' }}>
              <span className="wm-label">{group.title}</span>
              <div className="wm-hublinks">
                {group.links.map((l) => (
                  <Link key={l.href} href={l.href} className="ds-chip" aria-pressed={l.active || undefined}>
                    {l.label}
                    {l.count != null ? (
                      <span className="wm-data" style={{ opacity: 0.7 }}>
                        {l.count}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
