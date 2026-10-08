// The color theme: System (follow the OS), Light or Dark. Kept in localStorage when the browser allows it.
export type ThemeChoice = 'system' | 'light' | 'dark';

const KEY = 'prettydocs-theme';
const ORDER: ThemeChoice[] = ['system', 'light', 'dark'];

export function nextTheme(t: ThemeChoice): ThemeChoice {
  return ORDER[(ORDER.indexOf(t) + 1) % ORDER.length];
}

export function readTheme(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(t: ThemeChoice): void {
  const root = document.documentElement;
  if (t === 'system') root.removeAttribute('data-theme');
  else root.dataset.theme = t;
  try {
    if (t === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, t);
  } catch {
    // Private mode or blocked storage: the theme still applies for this visit.
  }
}
