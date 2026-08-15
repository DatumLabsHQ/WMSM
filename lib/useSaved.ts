'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'wmsm.saved';

/** Saved listings, kept in the browser. No account, no server, nothing to leak. */
export function useSaved() {
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setSaved(JSON.parse(raw) as string[]);
    } catch {
      // private mode or corrupt value — start empty
    }
  }, []);

  const persist = useCallback((next: string[]) => {
    setSaved(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // nothing we can do; the list still works for this session
    }
  }, []);

  const toggle = useCallback(
    (slug: string) => persist(saved.includes(slug) ? saved.filter((s) => s !== slug) : [...saved, slug]),
    [saved, persist],
  );

  return { saved, toggle, isSaved: (slug: string) => saved.includes(slug) };
}
