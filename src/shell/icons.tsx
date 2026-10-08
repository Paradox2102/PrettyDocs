// Small stroke icons for the page nav, drawn for this site (20 x 20, currentColor).
import type { PageKind } from './paths';

const PATHS: Record<PageKind, string> = {
  overview: 'M3.5 3.5h13v13h-13z M3.5 8h13 M8 8v8.5',
  wiring: 'M4 3v5a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v3 M2.5 3h3 M14.5 17h3',
  '3d': 'M10 2.5l6.5 3.75v7.5L10 17.5l-6.5-3.75v-7.5z M3.5 6.25L10 10l6.5-3.75 M10 10v7.5',
  devices: 'M7.5 5h9 M7.5 10h9 M7.5 15h9 M3.5 4.25v1.5 M3.5 9.25v1.5 M3.5 14.25v1.5',
  mechanical: 'M10 6.75a3.25 3.25 0 1 0 0 6.5a3.25 3.25 0 1 0 0-6.5z M10 2.5v2.25 M10 15.25v2.25 M2.5 10h2.25 M15.25 10h2.25 M4.7 4.7l1.6 1.6 M13.7 13.7l1.6 1.6 M4.7 15.3l1.6-1.6 M13.7 6.3l1.6-1.6',
};

export function PageIcon({ page }: { page: PageKind }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[page]} />
    </svg>
  );
}
