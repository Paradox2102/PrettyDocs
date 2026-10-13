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
afterEach(() => {
  vi.unstubAllGlobals();
  delete (Element.prototype as Partial<Element>).scrollIntoView; // jsdom has none; the hash tests add a stub
});

test('/icons is the gallery, not a robot named icons', async () => {
  await renderRouted(<AppRoutes />, '/icons');
  expect(screen.getByRole('heading', { level: 1, name: 'FRC device icons' })).toBeInTheDocument();
  expect(screen.queryByText(/Robot not found/i)).toBeNull();
});

test('one section per type, in the index order, with the count', async () => {
  await renderRouted(<AppRoutes />, '/icons');
  const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  expect(headings).toEqual(['Power', 'Radio and CAN']);
  const contents = screen.getByRole('navigation', { name: 'Icon types' });
  expect(within(contents).getByRole('link', { name: /Radio and CAN/ })).toHaveAttribute('href', '#communication');
  expect(within(contents).getByRole('link', { name: /Radio and CAN/ })).toHaveTextContent('2');
});

test('each icon has its picture, its vendor and a download link', async () => {
  await renderRouted(<AppRoutes />, '/icons');
  const radio = screen.getByRole('article', { name: 'VH-109 Radio' });
  expect(within(radio).getByRole('img')).toHaveAttribute('src', '/icons/communication/vivid-hosting/vh-109.svg');
  expect(within(radio).getByText('Vivid-Hosting')).toBeInTheDocument();
  const download = within(radio).getByRole('link', { name: /Download/ });
  expect(download).toHaveAttribute('href', '/icons/communication/vivid-hosting/vh-109.svg');
  expect(download).toHaveAttribute('download', 'vh-109.svg');
});

test('a legacy icon is tagged, a current one is not', async () => {
  await renderRouted(<AppRoutes />, '/icons');
  expect(within(screen.getByRole('article', { name: 'VH-109 Radio' })).getByText(/legacy/i)).toBeInTheDocument();
  expect(within(screen.getByRole('article', { name: 'CANivore' })).queryByText(/legacy/i)).toBeNull();
});

test('the page names the license and links the license and the index', async () => {
  await renderRouted(<AppRoutes />, '/icons');
  expect(screen.getByRole('link', { name: /CC BY 4.0/ })).toHaveAttribute('href', '/icons/LICENSE.md');
  expect(screen.getByRole('link', { name: /index\.json/ })).toHaveAttribute('href', '/icons/index.json');
  expect(screen.getByText(/FRC Team 2102 Paradox/)).toBeInTheDocument();
});

test('the robot pages link to the icon gallery', async () => {
  await renderRouted(<AppRoutes />, '/2026-offseason');
  expect(screen.getByRole('link', { name: 'Icons' })).toHaveAttribute('href', '/icons');
});

test('a direct link to /icons#<type> scrolls to that section once the list has loaded', async () => {
  const scrolled: Element[] = [];
  const spy = vi.fn(function (this: Element) { scrolled.push(this); });
  Element.prototype.scrollIntoView = spy;
  await renderRouted(<AppRoutes />, '/icons#communication');
  expect(scrolled.map((e) => e.id)).toEqual(['communication']);
});

test('a hash that names no section does not scroll', async () => {
  const spy = vi.fn();
  Element.prototype.scrollIntoView = spy;
  await renderRouted(<AppRoutes />, '/icons#nope');
  expect(spy).not.toHaveBeenCalled();
});

test('a malformed hash does not break the page', async () => {
  Element.prototype.scrollIntoView = vi.fn();
  await renderRouted(<AppRoutes />, '/icons#%E0%A4%A');
  expect(screen.getByRole('heading', { level: 1, name: 'FRC device icons' })).toBeInTheDocument();
});
