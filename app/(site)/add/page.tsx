import type { Metadata } from 'next';
import { Card } from '@/components/ds/Card';
import { Icon, type IconName } from '@/components/ds/Icon';
import { SectionHeader } from '@/components/ds/SectionHeader';
import { AddCompanyForm } from '@/components/site/AddCompanyForm';
import { getSectors } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Add your startup',
  description:
    'Get your company on the West Midlands Startup Map. Two minutes to submit, checked by a person, free for the companies listed.',
};

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'list', title: 'You submit', body: 'Six fields. Nothing about funding — we add that from announcements, with a source.' },
  { icon: 'user', title: 'A person reads it', body: 'We check the company exists, works in the region and is not a duplicate.' },
  { icon: 'map-pin', title: 'It goes on the map', body: 'You get an email with the link and a way to claim the listing and post roles.' },
];

export default async function AddPage() {
  const sectors = await getSectors();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 var(--space-6) var(--space-24)' }}>
      <section className="wm-hero">
        <h1>Get on the map</h1>
        <p>
          If you build something in Birmingham, Solihull, Coventry, Warwickshire or the Black Country, you belong on it. Listing is
          free and stays free.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {STEPS.map((s, i) => (
          <Card key={s.title} padding="var(--space-5)">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--route-100)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={s.icon} size={15} color="var(--route-600)" />
              </span>
              <span className="wm-label">Step {i + 1}</span>
            </div>
            <h3 style={{ font: 'var(--type-h3)', marginBottom: 6 }}>{s.title}</h3>
            <p style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)', margin: 0 }}>{s.body}</p>
          </Card>
        ))}
      </div>

      <AddCompanyForm sectors={sectors} />

      <p className="wm-data" style={{ color: 'var(--text-muted)', margin: 'var(--space-5) 0 0' }}>
        We store your email to reply to this submission and nothing else. Ask us to delete it any time.
      </p>
    </div>
  );
}
