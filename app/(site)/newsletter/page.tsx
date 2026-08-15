import type { Metadata } from 'next';
import { Card } from '@/components/ds/Card';
import { Icon, type IconName } from '@/components/ds/Icon';
import { NewsletterForm } from '@/components/site/NewsletterForm';
import { getRegionStats } from '@/lib/queries';
import { count } from '@/lib/format';

export const metadata: Metadata = {
  title: 'The weekly digest',
  description:
    'One email a week: new companies, raises and roles across Birmingham, Solihull, Coventry, Warwickshire and the Black Country.',
  alternates: { canonical: '/newsletter' },
};

const CONTENTS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'banknote', title: 'Who raised', body: 'Every round we can source that week, with the investors named.' },
  { icon: 'map-pin', title: 'Who is new', body: 'Companies added to the map since the last one, with a line on what they do.' },
  { icon: 'briefcase', title: 'Who is hiring', body: 'Roles posted by listed companies, filtered to within about fifteen miles of you.' },
];

export default async function NewsletterPage() {
  const stats = await getRegionStats();

  return (
    <>
      <section className="wm-hero">
        <h1>One email, every Tuesday</h1>
        <p>
          New companies, raises and roles across the region. Written from the same data as the map, so the numbers match the
          listings. No sponsors, no tracking pixels, unsubscribe in one click.
        </p>
      </section>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 var(--space-6) var(--space-24)' }}>
        <NewsletterForm companies={stats.companies} roles={stats.openRoles} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
          {CONTENTS.map((c) => (
            <Card key={c.title} padding="var(--space-5)" elevation="hairline">
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--route-100)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Icon name={c.icon} size={16} color="var(--route-600)" />
              </span>
              <h2 style={{ font: 'var(--type-h3)', marginBottom: 6 }}>{c.title}</h2>
              <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', margin: 0 }}>{c.body}</p>
            </Card>
          ))}
        </div>

        <p className="wm-data" style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--space-8)' }}>
          {count(stats.companies)} companies and {count(stats.openRoles)} open roles on the map today. We send to confirmed
          addresses only, and we do not sell the list.
        </p>
      </div>
    </>
  );
}
