import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { AppRoutes } from './App';
import { forget } from './content/load';
import { fakeFetch, SITE_FILES } from './test/fixtures';
import { renderRouted, settle } from './test/render';

const renderAt = (path: string) => renderRouted(<AppRoutes />, path);

beforeEach(() => {
  forget();
  vi.stubGlobal('fetch', vi.fn(fakeFetch(SITE_FILES)));
});
afterEach(() => vi.unstubAllGlobals());

test('/ opens the latest robot', async () => {
  await renderAt('/');
  expect(await screen.findByRole('heading', { level: 1, name: '2026 Offseason' })).toBeInTheDocument();
  expect(screen.getByTestId('where')).toHaveTextContent(/^\/2026-offseason$/);
});

test('a trailing slash opens the robot', async () => {
  await renderAt('/2026-offseason/');
  expect(await screen.findByRole('heading', { level: 1, name: '2026 Offseason' })).toBeInTheDocument();
});

test('capitals in the robot id redirect to the lowercase id and keep the page', async () => {
  await renderAt('/2026-Offseason/wiring#can');
  await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent(/^\/2026-offseason\/wiring#can$/));
});

test('an unknown robot shows Robot not found with a link per robot', async () => {
  await renderAt('/nope');
  expect(await screen.findByRole('heading', { name: 'Robot not found' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '2026 Offseason' })).toHaveAttribute('href', '/2026-offseason');
  expect(screen.getByRole('link', { name: '2025 Robot' })).toHaveAttribute('href', '/2025-robot');
});

test('an unknown page of a known robot shows Page not found', async () => {
  await renderAt('/2026-offseason/nope');
  expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
});

test('the robot selector keeps the page type', async () => {
  const user = userEvent.setup();
  await renderAt('/2026-offseason/devices');
  const select = await screen.findByRole('combobox', { name: 'Robot' });
  await settle(() => user.selectOptions(select, '2025-robot'));
  await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent(/^\/2025-robot\/devices$/));
});

test('the selector goes to the overview when the other robot lacks the page', async () => {
  const user = userEvent.setup();
  await renderAt('/2026-offseason/3d');
  const select = await screen.findByRole('combobox', { name: 'Robot' });
  await settle(() => user.selectOptions(select, '2025-robot'));
  await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent(/^\/2025-robot$/));
});

test('a robot without 3D has no 3D link and no 3D page', async () => {
  await renderAt('/2025-robot/3d');
  expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  expect(screen.queryAllByRole('link', { name: /3D/ })).toHaveLength(0);
  expect(screen.getAllByRole('link', { name: /Wiring/ }).length).toBeGreaterThan(0);
});

test('a failed index shows a message and Retry loads it', async () => {
  const user = userEvent.setup();
  vi.stubGlobal('fetch', vi.fn(fakeFetch({})));
  await renderAt('/');
  expect(await screen.findByText('The docs index did not load')).toBeInTheDocument();
  vi.stubGlobal('fetch', vi.fn(fakeFetch(SITE_FILES)));
  await settle(() => user.click(screen.getByRole('button', { name: 'Retry' })));
  expect(await screen.findByRole('heading', { level: 1, name: '2026 Offseason' })).toBeInTheDocument();
});

test('a slow failed index shows its message after one fetch, with no refetch loop', async () => {
  // Regression: a rejected promise left the cache, so each Suspense retry fetched again and the spinner never ended.
  const slow404 = vi.fn(() => new Promise<Response>((resolve) =>
    setTimeout(() => resolve(new Response('no', { status: 404, statusText: 'Not Found' })), 50)));
  vi.stubGlobal('fetch', slow404);
  await renderAt('/');
  expect(await screen.findByText('The docs index did not load', {}, { timeout: 2000 })).toBeInTheDocument();
  await new Promise((r) => setTimeout(r, 300));
  expect(slow404).toHaveBeenCalledTimes(1);
});
