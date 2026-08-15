import Link from 'next/link';
import { BrandTile } from './BrandTile';
import type { CompanyView } from '@/lib/queries';

/**
 * One tile in the wall: picture, name, one line, one metadata row.
 * Nothing else — the grid's job is to be scanned, not read.
 */
export function GalleryCard({ company }: { company: CompanyView }) {
  const meta = [company.sector, company.stage, company.hiring ? 'Hiring' : null, `Based in ${company.location.split(',')[0]}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link href={`/company/${company.slug}`} className="wm-gcard">
      <span className="wm-gcard__frame">
        <BrandTile name={company.name} slug={company.slug} color={company.sectorColor} logoUrl={company.logoUrl} />
      </span>
      <span className="wm-gcard__body">
        <span className="wm-gcard__name">{company.name}</span>
        <span className="wm-gcard__desc">{company.blurb}.</span>
        <span className="wm-gcard__meta">{meta}</span>
      </span>
    </Link>
  );
}
