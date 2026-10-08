import { screen, waitFor, within } from '@testing-library/react';
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

test('the page opens on the first subsystem with its facts and their sources', async () => {
  await open('/2026-offseason/mechanical');
  expect(screen.getByRole('heading', { level: 1, name: 'Mechanical' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Swerve' })).toBeChecked();
  expect(screen.getByRole('heading', { level: 2, name: 'Swerve' })).toBeInTheDocument();
  expect(screen.getByText('7.36:1')).toBeInTheDocument();
  expect(screen.getByText('TunerConstants.kDriveGearRatio')).toBeInTheDocument();
  expect(screen.getByText('No service notes yet.')).toBeInTheDocument();
});

test('the hash selects a subsystem and the switch writes it', async () => {
  const user = userEvent.setup();
  await open('/2026-offseason/mechanical#shooter');
  expect(screen.getByRole('radio', { name: 'Shooter' })).toBeChecked();
  await settle(() => user.click(screen.getByRole('radio', { name: 'Swerve' })));
  await waitFor(() => expect(where()).toBe('/2026-offseason/mechanical#swerve'));
});

test('an uncertain fact shows its reason, and a note shows as written', async () => {
  await open('/2026-offseason/mechanical#shooter');
  expect(screen.getByText('The code does not say which mechanism')).toBeInTheDocument();
  expect(screen.getByText('Check the flywheel belt tension before each event.')).toBeInTheDocument();
});

test('a device row links to the same device on the wiring page', async () => {
  await open('/2026-offseason/mechanical#shooter');
  const table = screen.getByRole('table', { name: 'Shooter devices' });
  expect(within(table).getByRole('link', { name: 'X44-side flywheel' }))
    .toHaveAttribute('href', '/2026-offseason/wiring?device=flywheel-x44-side');
  expect(within(table).getByText('can_s3 · 42 / 43')).toBeInTheDocument();
});

test('without WebGL the 3D area says so, the tables stay, and the scene is not downloaded', async () => {
  await open('/2026-offseason/mechanical');
  expect(await screen.findByText('This browser cannot show 3D.')).toBeInTheDocument();
  expect(screen.getByRole('table', { name: 'Swerve devices' })).toBeInTheDocument();
  const urls = vi.mocked(fetch).mock.calls.map((c) => String(c[0]));
  expect(urls.some((u) => u.endsWith('scene.json'))).toBe(false);
});

test('a robot without mechanical docs has no Mechanical link and no page', async () => {
  await open('/2025-robot/mechanical');
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  expect(screen.queryAllByRole('link', { name: /Mechanical/ })).toHaveLength(0);
});
