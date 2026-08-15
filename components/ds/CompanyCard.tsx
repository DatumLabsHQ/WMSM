'use client';

import type { CSSProperties } from 'react';
import { Badge } from './Badge';
import { Tag } from './Tag';
import { Icon } from './Icon';
import { monogram } from '@/lib/format';

export interface CompanyCardProps {
  name: string;
  sector?: string;
  sectorColor?: string;
  location?: string;
  stage?: string;
  headcount?: string;
  hiring?: boolean;
  verified?: boolean;
  blurb?: string;
  selected?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

/** Result-panel row for a company. A sector-coloured monogram stands in for logos we do not hold. */
export function CompanyCard({
  name,
  sector,
  sectorColor = 'var(--route-500)',
  location,
  stage,
  headcount,
  hiring,
  verified,
  blurb,
  selected,
  onClick,
  style,
}: CompanyCardProps) {
  return (
    <button type="button" aria-pressed={!!selected} onClick={onClick} className="ds-company" style={style}>
      <span className="ds-company__monogram" style={{ background: sectorColor }} aria-hidden="true">
        {monogram(name)}
      </span>
      <span style={{ display: 'grid', gap: 6, minWidth: 0, flex: 1 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ds-company__name">{name}</span>
          {verified ? <Icon name="circle-check" size={15} color="var(--route-500)" title="Verified listing" /> : null}
        </span>
        {blurb ? <span style={{ font: 'var(--type-body-sm)', color: 'var(--text-secondary)' }}>{blurb}</span> : null}
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {sector ? <Tag color={sectorColor}>{sector}</Tag> : null}
          {stage ? <Tag>{stage}</Tag> : null}
          {headcount ? <Tag>{headcount}</Tag> : null}
          {hiring ? (
            <Badge tone="success" dot>
              Hiring
            </Badge>
          ) : null}
        </span>
        {location ? (
          <span className="wm-data" style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name="map-pin" size={13} />
            {location}
          </span>
        ) : null}
      </span>
    </button>
  );
}
