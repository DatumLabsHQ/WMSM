'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ds/Badge';
import { Button } from '@/components/ds/Button';
import { Card } from '@/components/ds/Card';
import { Checkbox } from '@/components/ds/Checkbox';
import { EmptyState } from '@/components/ds/EmptyState';
import { Icon } from '@/components/ds/Icon';
import { Input } from '@/components/ds/Input';
import { ListingRow } from '@/components/ds/ListingRow';
import { Select } from '@/components/ds/Select';
import { Tabs } from '@/components/ds/Tabs';
import { plural, sinceLabel } from '@/lib/format';
import type { JobView, SectorView } from '@/lib/queries';

const DISCIPLINES = ['All roles', 'Engineering', 'Commercial', 'Ops', 'Design'];
const SALARY_FLOORS = [
  { value: '0', label: 'Any' },
  { value: '30000', label: '£30k+' },
  { value: '45000', label: '£45k+' },
  { value: '60000', label: '£60k+' },
  { value: '80000', label: '£80k+' },
];
const PAGE = 25;

export function JobsBoard({ jobs, sectors, localities }: { jobs: JobView[]; sectors: SectorView[]; localities: string[] }) {
  const [query, setQuery] = useState('');
  const [discipline, setDiscipline] = useState('All roles');
  const [chosenSectors, setChosenSectors] = useState<string[]>([]);
  const [locality, setLocality] = useState('Anywhere in the region');
  const [arrangement, setArrangement] = useState('Any arrangement');
  const [floor, setFloor] = useState('0');
  const [sort, setSort] = useState('newest');
  const [shown, setShown] = useState(PAGE);

  const perSector = useMemo(() => {
    const map = new Map<string, number>();
    for (const j of jobs) map.set(j.sector, (map.get(j.sector) ?? 0) + 1);
    return map;
  }, [jobs]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let out = jobs;
    if (needle) out = out.filter((j) => `${j.title} ${j.companyName} ${j.sector}`.toLowerCase().includes(needle));
    if (discipline !== 'All roles') out = out.filter((j) => j.discipline === discipline);
    if (chosenSectors.length) out = out.filter((j) => chosenSectors.includes(j.sector));
    if (locality !== 'Anywhere in the region') out = out.filter((j) => j.locality === locality);
    if (arrangement !== 'Any arrangement') out = out.filter((j) => j.arrangement === arrangement);
    if (floor !== '0') out = out.filter((j) => j.salaryFloor >= Number(floor));

    const sorted = [...out];
    if (sort === 'newest') sorted.sort((a, b) => b.postedAt.localeCompare(a.postedAt));
    if (sort === 'salary') sorted.sort((a, b) => b.salaryFloor - a.salaryFloor);
    return sorted;
  }, [jobs, query, discipline, chosenSectors, locality, arrangement, floor, sort]);

  const reset = () => {
    setQuery('');
    setDiscipline('All roles');
    setChosenSectors([]);
    setLocality('Anywhere in the region');
    setArrangement('Any arrangement');
    setFloor('0');
    setShown(PAGE);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 260px) 1fr', gap: 'var(--space-6)', alignItems: 'start' }} className="wm-jobs-grid">
      <Card padding="var(--space-5)" style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <Input
          icon="search"
          type="search"
          aria-label="Search role or company"
          placeholder="Role or company"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShown(PAGE);
          }}
        />

        <div>
          <span className="wm-label">Sector</span>
          <div style={{ marginTop: 6 }}>
            {sectors.map((s) => (
              <Checkbox
                key={s.slug}
                label={s.label}
                count={perSector.get(s.label) ?? 0}
                dotColor={s.color}
                checked={chosenSectors.includes(s.label)}
                onChange={(e) => {
                  setChosenSectors((prev) => (e.target.checked ? [...prev, s.label] : prev.filter((x) => x !== s.label)));
                  setShown(PAGE);
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="wm-label">Location</span>
          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
            <Select
              size="sm"
              aria-label="Location"
              options={['Anywhere in the region', ...localities]}
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
            />
            <Select
              size="sm"
              aria-label="Working arrangement"
              options={['Any arrangement', 'Hybrid', 'On-site', 'Remote']}
              value={arrangement}
              onChange={(e) => setArrangement(e.target.value)}
            />
          </div>
        </div>

        <div>
          <span className="wm-label">Salary floor</span>
          <div style={{ marginTop: 8 }}>
            <Select size="sm" aria-label="Salary floor" options={SALARY_FLOORS} value={floor} onChange={(e) => setFloor(e.target.value)} />
          </div>
          <p className="wm-data" style={{ color: 'var(--text-muted)', margin: '8px 0 0' }}>
            Day rates are excluded by this filter.
          </p>
        </div>

        <Button variant="ghost" size="sm" onClick={reset}>
          Reset filters
        </Button>
      </Card>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Tabs
            variant="segmented"
            label="Discipline"
            tabs={DISCIPLINES}
            value={discipline}
            onChange={(v) => {
              setDiscipline(v);
              setShown(PAGE);
            }}
          />
          <Select
            size="sm"
            aria-label="Sort roles"
            options={[
              { value: 'newest', label: 'Newest first' },
              { value: 'salary', label: 'Salary high to low' },
            ]}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            wrapStyle={{ width: 200 }}
          />
        </div>

        <Card padding="var(--space-4)">
          {filtered.length ? (
            <>
              {filtered.slice(0, shown).map((j) => (
                <ListingRow
                  key={j.id}
                  icon="briefcase"
                  title={
                    <>
                      {j.title} <Badge tone="neutral" style={{ marginLeft: 6 }}>{j.arrangement}</Badge>
                    </>
                  }
                  subtitle={`${j.companyName} · ${j.locality}`}
                  meta={[j.salaryLabel, j.sector, sinceLabel(new Date(j.postedAt))]}
                  href={`/company/${j.companySlug}#roles`}
                />
              ))}
              {shown < filtered.length ? (
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-5)' }}>
                  <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)} iconRight={<Icon name="chevron-down" size={15} />}>
                    Load {Math.min(PAGE, filtered.length - shown)} more
                  </Button>
                </div>
              ) : (
                <p className="wm-data" style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 'var(--space-5) 0 0' }}>
                  That is all {plural(filtered.length, 'role')} matching.
                </p>
              )}
            </>
          ) : (
            <EmptyState
              icon="briefcase"
              title="No roles match"
              message="Widen the salary floor or clear a sector. Listed companies post free, so the board fills up quickly."
              action={
                <Button size="sm" variant="secondary" onClick={reset}>
                  Reset filters
                </Button>
              }
            />
          )}
        </Card>
      </div>
    </div>
  );
}
