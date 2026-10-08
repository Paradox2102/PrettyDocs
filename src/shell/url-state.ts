import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';

/**
 * Page state kept in the URL: query parameters (`?device=`, `?open=`) and the hash. A change replaces the history
 * entry, so the back button leaves the page instead of stepping through every click.
 */
export function useUrlState() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  const update = useCallback(
    (change: { set?: Record<string, string | null>; hash?: string }) => {
      const next = new URLSearchParams(location.search);
      for (const [k, v] of Object.entries(change.set ?? {})) {
        if (v === null) next.delete(k);
        else next.set(k, v);
      }
      const search = next.toString();
      navigate({ pathname: location.pathname, search: search ? `?${search}` : '', hash: change.hash ?? location.hash },
        { replace: true });
    },
    [location.pathname, location.search, location.hash, navigate],
  );

  return { params, hash: location.hash, update };
}
