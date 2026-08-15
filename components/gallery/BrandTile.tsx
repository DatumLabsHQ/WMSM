import type { CSSProperties } from 'react';

/**
 * The picture in a gallery that has no pictures.
 *
 * No logos or screenshots were supplied, and the design rule is that we do not
 * invent a company's mark. So each listing gets a typographic tile built from its
 * own name and its sector hue. Four treatments, chosen deterministically from the
 * slug, so the grid reads as a curated wall rather than a swatch chart — and so a
 * company's tile never changes between visits.
 *
 * When real logos arrive, pass `logoUrl` and this steps aside.
 */

type Treatment = 'wash' | 'ink' | 'paper' | 'letter';
/* Weighted, not uniform: colour should dominate the wall, with the dark and light
   tiles arriving often enough to break the rhythm and rarely enough to feel chosen. */
const TREATMENTS: Treatment[] = ['wash', 'letter', 'paper', 'wash', 'letter', 'ink', 'wash', 'paper'];

/** FNV-1a with a murmur3 finalizer — the plain hash's low bits correlate across
 *  similar slugs, which put three identical treatments next to each other. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}

export interface BrandTileProps {
  name: string;
  slug: string;
  color: string;
  /** Drop a real image in here later and the generated tile disappears. */
  logoUrl?: string | null;
}

export function BrandTile({ name, slug, color, logoUrl }: BrandTileProps) {
  if (logoUrl) {
    // Contained and centred on a tint of the sector hue, never stretched: these are
    // marks the company published for its own site, not artwork cut for this shape.
    // Rendered as a plain img because the host is arbitrary and never rehosted.
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '18cqw',
          background: `color-mix(in oklab, ${color} 8%, #FFFFFF)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </div>
    );
  }

  const seed = hash(slug);
  const treatment = TREATMENTS[seed % TREATMENTS.length];
  const angle = 120 + (seed % 5) * 15;
  const initial = name.replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase() || '?';

  const base: CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    padding: '9cqw',
    overflow: 'hidden',
    isolation: 'isolate',
  };

  /* The brand book's gradient recipe — noise for depth, texture for tactility —
     applied to the coloured treatments. The light 'paper' tile is left clean;
     texture over near-white reads as dirt rather than depth. */
  const brandLayers = 'wm-noise wm-texture';

  const nameType: CSSProperties = {
    font: `var(--weight-semibold) clamp(17px, 8.4cqw, 34px)/1.08 var(--font-display)`,
    letterSpacing: '-0.035em',
    textWrap: 'balance',
  };

  if (treatment === 'wash') {
    return (
      <div
        className={brandLayers}
        style={{
          ...base,
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background: `linear-gradient(${angle}deg, ${color}, color-mix(in oklab, ${color} 62%, var(--prussian)))`,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '-6cqw',
            bottom: '-22cqw',
            font: `var(--weight-bold) 56cqw/1 var(--font-display)`,
            color: 'rgba(255,255,255,.10)',
            letterSpacing: '-0.06em',
          }}
        >
          {initial}
        </span>
        <span style={{ ...nameType, color: '#fff', position: 'relative' }}>{name}</span>
      </div>
    );
  }

  if (treatment === 'letter') {
    return (
      <div
        className={brandLayers}
        style={{
          ...base,
          alignItems: 'flex-end',
          background: color,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-3cqw',
            top: '-16cqw',
            font: `var(--weight-bold) 68cqw/1 var(--font-display)`,
            color: 'rgba(255,255,255,.16)',
            letterSpacing: '-0.07em',
          }}
        >
          {initial}
        </span>
        <span style={{ ...nameType, color: '#fff', position: 'relative', fontSize: 'clamp(16px, 7.2cqw, 29px)' }}>{name}</span>
      </div>
    );
  }

  if (treatment === 'paper') {
    return (
      <div
        style={{
          ...base,
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          flexDirection: 'column',
          gap: '4cqw',
          background: `color-mix(in oklab, ${color} 6%, #FFFFFF)`,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: '13cqw',
            height: '13cqw',
            borderRadius: '3.4cqw',
            background: color,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            font: `var(--weight-bold) 7cqw/1 var(--font-display)`,
          }}
        >
          {initial}
        </span>
        <span style={{ ...nameType, color: `color-mix(in oklab, ${color} 78%, var(--prussian))` }}>{name}</span>
      </div>
    );
  }

  return (
    <div
      className={brandLayers}
      style={{
        ...base,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        flexDirection: 'column',
        gap: '4cqw',
        background: 'var(--gradient-brand-deep)',
      }}
    >
      <span aria-hidden="true" style={{ width: '3.2cqw', height: '3.2cqw', borderRadius: '50%', background: color }} />
      <span style={{ ...nameType, color: '#fff' }}>{name}</span>
    </div>
  );
}
