import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { AppRoutes } from '../App';
import { forget } from '../content/load';
import { fakeFetch, SITE_FILES } from '../test/fixtures';
import { renderRouted, settle } from '../test/render';

const open = (path: string) => renderRouted(<AppRoutes />, path);
const where = () => screen.getByTestId('where').textContent;
const drawing = () => screen.getByRole('figure');

beforeEach(() => {
  forget();
  vi.stubGlobal('fetch', vi.fn(fakeFetch(SITE_FILES)));
});
afterEach(() => vi.unstubAllGlobals());

test('the page opens on the gamepad with its bindings, front view, plain detail', async () => {
  await open('/2026-offseason/controls');
  expect(screen.getByRole('heading', { level: 1, name: 'Controls' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Driver gamepad' })).toBeChecked();
  expect(screen.getByRole('radio', { name: 'Front' })).toBeChecked();
  const list = screen.getByRole('list', { name: 'Bindings' });
  expect(within(list).getByText('Shoot')).toBeInTheDocument();
  expect(within(list).getAllByText('Hold')).toHaveLength(2);
  expect(screen.queryByText('rightBumper().whileTrue(...)')).toBeNull();
  expect(screen.getByText(/Checked against RobotContainer.java/)).toBeInTheDocument();
  expect(within(drawing()).getByRole('button', { name: 'Left stick: Drive' })).toBeInTheDocument();
});

test('the hash picks the joystick, with its note and every input not used', async () => {
  await open('/2026-offseason/controls#joystick');
  expect(screen.getByRole('radio', { name: 'Joystick' })).toBeChecked();
  expect(screen.getByText('The code declares m_joystick on port 1 but binds nothing yet.')).toBeInTheDocument();
  expect(screen.getByText('Nothing is bound to this controller yet.')).toBeInTheDocument();
  expect(screen.getByRole('list', { name: 'Not used' }).children).toHaveLength(16);
  expect(screen.getByRole('radio', { name: 'Top' })).toBeChecked();
});

test('Code shows the code line under each binding', async () => {
  const user = userEvent.setup();
  await open('/2026-offseason/controls');
  await settle(() => user.click(screen.getByRole('radio', { name: 'Code' })));
  await waitFor(() => expect(where()).toBe('/2026-offseason/controls?detail=code'));
  expect(screen.getByText('rightBumper().whileTrue(...)')).toBeInTheDocument();
});

test('a row click selects the input in the drawing, and a second click clears it', async () => {
  const user = userEvent.setup();
  await open('/2026-offseason/controls');
  const row = within(screen.getByRole('list', { name: 'Bindings' })).getByRole('button', { name: /Drive/ });
  await settle(() => user.click(row));
  await waitFor(() => expect(where()).toBe('/2026-offseason/controls?input=ls'));
  expect(row).toHaveAttribute('aria-pressed', 'true');
  expect(within(drawing()).getByRole('button', { name: 'Left stick: Drive' })).toHaveAttribute('aria-pressed', 'true');
  await settle(() => user.click(row));
  await waitFor(() => expect(where()).toBe('/2026-offseason/controls'));
});

test('a mark click in the drawing selects its row', async () => {
  const user = userEvent.setup();
  await open('/2026-offseason/controls?view=back');
  await settle(() => user.click(within(drawing()).getByRole('button', { name: 'Right bumper: Shoot' })));
  await waitFor(() => expect(where()).toBe('/2026-offseason/controls?view=back&input=rb'));
  const row = within(screen.getByRole('list', { name: 'Bindings' })).getByRole('button', { name: /Shoot/ });
  expect(row).toHaveAttribute('aria-pressed', 'true');
});

test('a row whose input is not in this view still selects without error', async () => {
  const user = userEvent.setup();
  await open('/2026-offseason/controls');
  expect(within(drawing()).queryByRole('button', { name: /Left trigger/ })).toBeNull();
  await settle(() => user.click(within(screen.getByRole('list', { name: 'Bindings' })).getByRole('button', { name: /Intake/ })));
  await waitFor(() => expect(where()).toBe('/2026-offseason/controls?input=lt'));
});

test('the back view draws the triggers and the M buttons as not used', async () => {
  await open('/2026-offseason/controls?view=back');
  expect(within(drawing()).getByRole('button', { name: 'Left trigger: Intake' })).toBeInTheDocument();
  expect(within(drawing()).getByRole('button', { name: 'M1 multi-function: not used' })).toBeInTheDocument();
});

test('switching controller drops the selected input', async () => {
  const user = userEvent.setup();
  await open('/2026-offseason/controls?input=rb');
  await settle(() => user.click(screen.getByRole('radio', { name: 'Joystick' })));
  await waitFor(() => expect(where()).toBe('/2026-offseason/controls#joystick'));
});

test('an unknown input, view or controller falls back quietly', async () => {
  await open('/2026-offseason/controls?input=paddle&view=sideways#nope');
  expect(screen.getByRole('radio', { name: 'Driver gamepad' })).toBeChecked();
  expect(screen.getByRole('radio', { name: 'Front' })).toBeChecked();
  expect(within(screen.getByRole('list', { name: 'Bindings' })).getAllByRole('button')
    .every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true);
});

test('3D without WebGL says so', async () => {
  await open('/2026-offseason/controls?view=3d');
  expect(await screen.findByText('This browser cannot show 3D.')).toBeInTheDocument();
});

test('a robot without the controls doc has no Controls page', async () => {
  await open('/2025-robot/controls');
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
});
