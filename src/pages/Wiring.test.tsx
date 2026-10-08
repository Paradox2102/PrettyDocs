import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { AppRoutes } from '../App';
import { forget } from '../content/load';
import { fakeFetch, SITE_FILES } from '../test/fixtures';
import { renderRouted, settle } from '../test/render';

const open = (path: string) => renderRouted(<AppRoutes />, path);
const where = () => screen.getByTestId('where').textContent;

beforeEach(() => {
  forget();
  vi.stubGlobal('fetch', vi.fn(fakeFetch(SITE_FILES)));
});
afterEach(() => vi.unstubAllGlobals());

test('search "43" finds the motor with CAN ID 42 / 43 and opens it', async () => {
  const user = userEvent.setup();
  await open('/2026-offseason/wiring');
  await settle(() => user.type(screen.getByRole('searchbox', { name: 'Search devices' }), '43'));
  expect(screen.getByText('1 match')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'X44-side flywheel' })).toBeInTheDocument();
  expect(where()).toMatch(/[?&]device=flywheel-x44-side/);
});

test('?device= opens the device panel', async () => {
  await open('/2026-offseason/wiring?device=left-pi');
  expect(screen.getByRole('heading', { level: 2, name: 'Orange Pi 5 Pro · left-pi' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Show in 3D' })).toHaveAttribute('href', '/2026-offseason/3d?device=left-pi');
  expect(screen.getByRole('link', { name: 'Show in table' })).toHaveAttribute('href', '/2026-offseason/devices?device=left-pi');
});

test('an unknown ?device= opens no panel', async () => {
  await open('/2026-offseason/wiring?device=nope');
  expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
});

test('the hash sets the sheet and the view', async () => {
  await open('/2026-offseason/wiring#top-power');
  expect(screen.getByRole('radio', { name: 'Top view' })).toBeChecked();
  expect(screen.getByRole('radio', { name: 'Power' })).toBeChecked();
});

test('choosing a view writes the hash and keeps the device', async () => {
  const user = userEvent.setup();
  await open('/2026-offseason/wiring?device=left-pi');
  await settle(() => user.click(screen.getByRole('radio', { name: 'Network' })));
  await waitFor(() => expect(where()).toBe('/2026-offseason/wiring?device=left-pi#network'));
});

test('?open=1 ticks Show only open items', async () => {
  await open('/2026-offseason/wiring?open=1');
  expect(screen.getByRole('checkbox', { name: 'Show only open items' })).toBeChecked();
});

test('a device that the top view does not draw says so', async () => {
  await open('/2026-offseason/wiring?device=left-pi#top');
  expect(screen.getByText('Not drawn on this sheet.')).toBeInTheDocument();
});

test('the poster download link points at the export', async () => {
  await open('/2026-offseason/wiring');
  expect(screen.getByRole('link', { name: /Download poster/ })).toHaveAttribute('href',
    '/content/robots/2026-offseason/poster.svg');
});

test('Close clears the device', async () => {
  const user = userEvent.setup();
  await open('/2026-offseason/wiring?device=left-pi');
  await settle(() => user.click(screen.getByRole('button', { name: 'Close device details' })));
  expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  expect(where()).toBe('/2026-offseason/wiring');
});

test('a press on a search result keeps focus in the search box (Safari closes the list on blur)', async () => {
  const user = userEvent.setup();
  await open('/2026-offseason/wiring');
  await settle(() => user.type(screen.getByRole('searchbox', { name: 'Search devices' }), 'drive'));
  const result = screen.getByRole('button', { name: /FL drive/ });
  // fireEvent returns false when a handler called preventDefault(): the press does not take focus from the input.
  expect(fireEvent.mouseDown(result)).toBe(false);
});
