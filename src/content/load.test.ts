import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { contentUrl, forget, INDEX_URL, loadJson, loadText } from './load';

const ok = (body: string) => new Response(body, { status: 200 });

beforeEach(() => forget());
afterEach(() => vi.unstubAllGlobals());

test('contentUrl and INDEX_URL', () => {
  expect(contentUrl('2026-offseason', 'scene.json')).toBe('/content/robots/2026-offseason/scene.json');
  expect(INDEX_URL).toBe('/content/robots.json');
});

test('two loads of one URL fetch once', async () => {
  const fetchMock = vi.fn(async () => ok('{"a":1}'));
  vi.stubGlobal('fetch', fetchMock);
  const a = loadJson('/x.json', (x) => x);
  const b = loadJson('/x.json', (x) => x);
  expect(a).toBe(b);
  expect(await a).toEqual({ a: 1 });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('a 404 rejects with the URL and the status; the failure stays cached until forget()', async () => {
  // A failed load must stay failed: React 19 use() calls the loader again on every retry render, and a fresh
  // fetch each time would loop forever behind the Suspense spinner. Retry calls forget().
  const fetchMock = vi.fn(async () => new Response('no', { status: 404, statusText: 'Not Found' }));
  vi.stubGlobal('fetch', fetchMock);
  await expect(loadText('/missing.svg')).rejects.toThrow(/\/missing\.svg.*404/);
  await expect(loadText('/missing.svg')).rejects.toThrow(/404/);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  forget('/missing.svg');
  await expect(loadText('/missing.svg')).rejects.toThrow(/404/);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('a validator error rejects the load', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ok('{}')));
  await expect(loadJson('/bad.json', () => { throw new Error('bad shape'); })).rejects.toThrow(/bad shape/);
});

test('forget(url) makes the next load fetch again', async () => {
  const fetchMock = vi.fn(async () => ok('text'));
  vi.stubGlobal('fetch', fetchMock);
  await loadText('/t.svg');
  forget('/t.svg');
  await loadText('/t.svg');
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
