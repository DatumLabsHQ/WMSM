'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wordmark } from '@/components/Wordmark';
import { ButtonLink } from '@/components/ds/Button';

const LINKS = [
  { href: '/', label: 'Explore' },
  { href: '/map', label: 'Map' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/funding', label: 'Funding' },
  { href: '/news', label: 'News' },
];

/** Logo left, pill nav dead centre, one blue call to action right. */
export function TopBar() {
  const pathname = usePathname();

  return (
    <header className="wm-topbar">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Wordmark />
      </div>

      <div className="wm-topbar__nav">
        <nav aria-label="Primary" className="ds-pillnav">
          {LINKS.map((l) => {
            const active = l.href === '/' ? pathname === '/' : pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link key={l.href} href={l.href} className="ds-pillnav__item" aria-current={active ? 'page' : undefined}>
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="wm-topbar__right">
        <ButtonLink href="/add" size="sm">
          Add your startup
        </ButtonLink>
      </div>
    </header>
  );
}
