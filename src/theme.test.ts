import { afterEach, expect, test, vi } from 'vitest';
import { applyTheme, nextTheme, readTheme } from './theme';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

test('the theme cycles system, light, dark', () => {
  expect(nextTheme('system')).toBe('light');
  expect(nextTheme('light')).toBe('dark');
  expect(nextTheme('dark')).toBe('system');
});

test('dark and light set data-theme; system removes it', () => {
  applyTheme('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');
  applyTheme('light');
  expect(document.documentElement.dataset.theme).toBe('light');
  applyTheme('system');
  expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
});

test('the choice is kept and read back', () => {
  applyTheme('dark');
  expect(readTheme()).toBe('dark');
});

test('a broken localStorage does not break the theme', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
  expect(() => applyTheme('dark')).not.toThrow();
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(readTheme()).toBe('system');
});

test('an unknown stored value reads as system', () => {
  localStorage.setItem('prettydocs-theme', 'purple');
  expect(readTheme()).toBe('system');
});
