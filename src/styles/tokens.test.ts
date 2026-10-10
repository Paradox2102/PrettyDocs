// WCAG contrast of the color tokens, for both themes: text tokens need 4.5:1, the focus/accent mark needs 3:1.
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const css = readFileSync(`${process.cwd()}/src/styles/tokens.css`, 'utf8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const THEMES = { light: block(':root {'), dark: block(':root[data-theme="dark"]') };

describe.each(Object.entries(THEMES))('%s theme', (_name, t) => {
  test.each(['ink', 'muted', 'accent-ink', 'warn-fg'])('--%s text has 4.5:1 on --bg and --surface', (token) => {
    const bgs = token === 'warn-fg' ? [t['warn-bg']] : [t.bg, t.surface];
    for (const bg of bgs) expect(contrast(t[token], bg)).toBeGreaterThanOrEqual(4.5);
  });
  test('--accent (focus ring, active marks) has 3:1 on --bg and --surface', () => {
    expect(contrast(t.accent, t.bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(t.accent, t.surface)).toBeGreaterThanOrEqual(3);
  });
  test('--on-accent text has 4.5:1 on --accent', () => {
    expect(contrast(t['on-accent'], t.accent)).toBeGreaterThanOrEqual(4.5);
  });
});
