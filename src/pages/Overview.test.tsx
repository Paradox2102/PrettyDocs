import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { AppRoutes } from '../App';
import { forget } from '../content/load';
import { fakeFetch, SITE_FILES } from '../test/fixtures';
import { renderRouted } from '../test/render';

vi.mock('../components/RobotHero', () => ({ RobotHero: () => <div data-testid="hero" /> }));

beforeEach(() => {
  forget();
  vi.stubGlobal('fetch', vi.fn(fakeFetch(SITE_FILES)));
});
afterEach(() => vi.unstubAllGlobals());

test('the overview shows the robot, the facts and a card per page', async () => {
  await renderRouted(<AppRoutes />, '/2026-offseason');
  expect(screen.getByRole('heading', { level: 1, name: '2026 Offseason' })).toBeInTheDocument();
  expect(screen.getByText('Team 2102 · Paradox')).toBeInTheDocument();
  const facts = screen.getByRole('list', { name: 'Robot facts' });
  expect(within(facts).getByText('Devices').parentElement).toHaveTextContent('4');
  const main = screen.getByRole('main');
  expect(within(main).getByRole('link', { name: /^Wiring/ })).toHaveAttribute('href', '/2026-offseason/wiring');
  expect(within(main).getByRole('link', { name: /^3D/ })).toHaveAttribute('href', '/2026-offseason/3d');
  expect(within(main).getByRole('link', { name: /^Devices/ })).toHaveAttribute('href', '/2026-offseason/devices');
  expect(screen.getByTestId('hero')).toBeInTheDocument();
});

test('the open items card links to the wiring page with open items on', async () => {
  await renderRouted(<AppRoutes />, '/2026-offseason');
  const card = screen.getByRole('link', { name: /2 open items/ });
  expect(card).toHaveAttribute('href', '/2026-offseason/wiring?open=1');
});

test('a robot without 3D has no 3D card and no hero', async () => {
  await renderRouted(<AppRoutes />, '/2025-robot');
  const main = screen.getByRole('main');
  expect(within(main).queryByRole('link', { name: /^3D/ })).toBeNull();
  expect(screen.queryByTestId('hero')).toBeNull();
});
