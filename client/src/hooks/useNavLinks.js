import { useEffect, useState } from 'react';
import { navLinksApi } from '../api/navLinks.api.js';
import { NAV_LINKS as FALLBACK } from '../lib/constants.js';

/* Cache so every consumer doesn't refetch on mount. */
let cached = null;
let inFlight = null;

function normalize(items) {
  return items.map((i, idx) => ({
    key: i._id || `${i.label}-${idx}`,
    label: i.label,
    path: i.path,
    end: Boolean(i.end),
  }));
}

/**
 * Returns the admin-managed navbar items. Falls back to the bundled
 * `NAV_LINKS` constants while the request is in-flight or if it fails.
 */
export function useNavLinks() {
  const [links, setLinks] = useState(cached || FALLBACK);

  useEffect(() => {
    if (cached) return undefined;
    let cancelled = false;
    if (!inFlight) inFlight = navLinksApi.list().catch(() => null);
    inFlight.then((items) => {
      inFlight = null;
      if (!items || cancelled) return;
      cached = normalize(items);
      setLinks(cached);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return links;
}

export function refreshNavLinks() {
  cached = null;
  inFlight = null;
}
