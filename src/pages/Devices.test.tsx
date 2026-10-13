import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { AppRoutes } from '../App';
import { forget } from '../content/load';
import { fakeFetch, ICONS, SITE_FILES } from '../test/fixtures';
import { renderRouted, settle } from '../test/render';

const open = (path: string) => renderRouted(<AppRoutes />, path);
const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);

beforeEach(() => {
  forget();
  vi.stubGlobal('fetch', vi.fn(fakeFetch(SITE_FILES)));
});
afterEach(() => vi.unstubAllGlobals());

test('the table lists every device', async () => {
  await open('/2026-offseason/devices');
  expect(screen.getByRole('heading', { level: 1, name: 'Devices' })).toBeInTheDocument();
  expect(bodyRows()).toHaveLength(4);
});

test('the PDH column shows a lightning bolt and the channel, never "ch"', async () => {
  await open('/2026-offseason/devices');
  const cells = [...document.querySelectorAll('td[data-label="PDH"]')].filter((c) => c.textContent);
  expect(cells.map((c) => c.textContent).sort()).toEqual(['10', '2', '21']);
  expect(cells.every((c) => c.querySelector('svg'))).toBe(true);
});

test('search "43" leaves only the matching rows', async () => {
  const user = userEvent.setup();
  await open('/2026-offseason/devices');
  await settle(() => user.type(screen.getByRole('searchbox', { name: 'Search devices' }), '43'));
  expect(bodyRows()).toHaveLength(1);
  expect(bodyRows()[0]).toHaveTextContent('X44-side flywheel');
});

test('the Open items chip shows its count and filters', async () => {
  const user = userEvent.setup();
  await open('/2026-offseason/devices');
  const chip = screen.getByRole('radio', { name: /Open items\s*2/ });
  await settle(() => user.click(chip));
  expect(bodyRows()).toHaveLength(2);
});

test('a click on a row opens the device panel', async () => {
  const user = userEvent.setup();
  await open('/2026-offseason/devices');
  await settle(() => user.click(screen.getByRole('button', { name: 'FL drive' })));
  expect(screen.getByRole('heading', { level: 2, name: 'FL drive' })).toBeInTheDocument();
  expect(screen.getByTestId('where')).toHaveTextContent('?device=swerve-fl-drive');
});

test('?device= opens the panel on load', async () => {
  await open('/2026-offseason/devices?device=camera-front-left');
  expect(screen.getByRole('heading', { level: 2, name: 'front_left' })).toBeInTheDocument();
});

test('a header click sorts and sets aria-sort', async () => {
  const user = userEvent.setup();
  await open('/2026-offseason/devices');
  await settle(() => user.click(screen.getByRole('button', { name: /^CAN/ })));
  expect(screen.getByRole('columnheader', { name: /^CAN/ })).toHaveAttribute('aria-sort', 'ascending');
  expect(bodyRows()[0]).toHaveTextContent('FL drive');
});

const KRAKENS = {
  ...ICONS,
  types: [{ id: 'motors', name: 'Motors', count: 2 }],
  icons: ['kraken-x60', 'kraken-x44'].map((slug) => ({
    ...ICONS.icons[0], slug, name: slug, type: 'motors', vendor: 'wcp', vendor_name: 'WestCoast Products',
    path: `motors/wcp/${slug}.svg`,
  })),
};
const rowOf = (role: string) => screen.getByRole('button', { name: role }).closest('tr')!;

test('each device with an icon shows a small copy of it next to its name', async () => {
  vi.stubGlobal('fetch', vi.fn(fakeFetch({ ...SITE_FILES, '/icons/index.json': KRAKENS })));
  await open('/2026-offseason/devices');
  const img = rowOf('FL drive').querySelector('td[data-label="Device"] img');
  expect(img).toHaveAttribute('src', '/icons/motors/wcp/kraken-x60.svg');
  expect(rowOf('X44-side flywheel').querySelector('img')).toHaveAttribute('src', '/icons/motors/wcp/kraken-x44.svg');
});

test('a device whose icon is not in the collection shows no picture', async () => {
  vi.stubGlobal('fetch', vi.fn(fakeFetch({ ...SITE_FILES, '/icons/index.json': KRAKENS })));
  await open('/2026-offseason/devices');
  expect(rowOf('Orange Pi 5 Pro · left-pi').querySelector('img')).toBeNull();
});

test('the table still shows every device when the icon list does not load', async () => {
  const files: Record<string, unknown> = { ...SITE_FILES };
  delete files['/icons/index.json'];
  vi.stubGlobal('fetch', vi.fn(fakeFetch(files)));
  await open('/2026-offseason/devices');
  expect(bodyRows()).toHaveLength(4);
  expect(screen.getByRole('table').querySelector('img')).toBeNull();
  expect(screen.queryByText(/did not load/)).toBeNull();
});
