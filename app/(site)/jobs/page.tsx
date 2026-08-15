import type { Metadata } from 'next';
import Link from 'next/link';
import { JobsBoard } from '@/components/site/JobsBoard';
import { DigestSignup } from '@/components/site/DigestSignup';
import { getJobs, getSectors } from '@/lib/queries';
import { count } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Jobs',
  description:
    'Open roles at startups across Birmingham, Solihull, Coventry, Warwickshire and the Black Country. Posted free by companies on the map. No agencies, no reposts.',
};

export default async function JobsPage() {
  const [jobs, sectors] = await Promise.all([getJobs(), getSectors()]);
  const localities = [...new Set(jobs.map((j) => j.locality))].sort();

  return (
    <>
      <section className="wm-hero">
        <h1>{count(jobs.length)} open roles across the region</h1>
        <p>
          Posted free by companies on the map. No agencies, no reposts, and every employer here has a profile you can check first.{' '}
          <Link href="/add">Post a role</Link>.
        </p>
      </section>

      <div className="wm-page" style={{ paddingBottom: 'var(--space-24)' }}>
        <JobsBoard jobs={jobs} sectors={sectors} localities={localities} />

        <div style={{ marginTop: 'var(--space-8)' }} id="digest">
          <DigestSignup source="jobs" />
        </div>
      </div>
    </>
  );
}
