import { screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { AppRoutes } from '../App';
import { forget } from '../content/load';
import { fakeFetch, SITE_FILES } from '../test/fixtures';
import { renderRouted } from '../test/render';

beforeEach(() => {
  forget();
  vi.stubGlobal('fetch', vi.fn(fakeFetch(SITE_FILES)));
});
afterEach(() => vi.unstubAllGlobals());

test('without WebGL the 3D page says so, links to the wiring, and does not download the scene', async () => {
  await renderRouted(<AppRoutes />, '/2026-offseason/3d');
  expect(await screen.findByText('This browser cannot show 3D.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open the wiring sheets' })).toHaveAttribute('href', '/2026-offseason/wiring');
  const urls = vi.mocked(fetch).mock.calls.map((c) => String(c[0]));
  expect(urls.some((u) => u.endsWith('scene.json'))).toBe(false);
});
