import type { DocKind } from '../content/types';

export type PageKind = 'overview' | DocKind;

export const PAGE_LABELS: Record<PageKind, string> = {
  overview: 'Overview',
  wiring: 'Wiring',
  '3d': '3D',
  devices: 'Devices',
};

export function pagePath(robot: string, page: PageKind): string {
  return page === 'overview' ? `/${robot}` : `/${robot}/${page}`;
}

/** The page type of a path under a robot: "/r" is the overview, "/r/wiring" is wiring; anything else is null. */
export function pageOf(pathname: string): PageKind | null {
  const rest = pathname.split('/').filter(Boolean).slice(1);
  if (rest.length === 0) return 'overview';
  if (rest.length === 1 && (rest[0] === 'wiring' || rest[0] === '3d' || rest[0] === 'devices')) return rest[0];
  return null;
}

export function formatBuilt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function pageTitle(page: string | null, robotName: string): string {
  return page ? `${page} · ${robotName} · Team 2102` : `${robotName} · Team 2102`;
}
