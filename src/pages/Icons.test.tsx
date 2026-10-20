import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { AppRoutes } from '../App';
import { forget } from '../content/load';
import { fakeFetch, SITE_FILES } from '../test/fixtures';
import { renderRouted, settle } from '../test/render';

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

test('the page says public domain, no credit needed, and links the license and the index', async () => {
  await renderRouted(<AppRoutes />, '/icons');
  expect(screen.getByRole('link', { name: /CC0 1\.0/ })).toHaveAttribute('href', '/icons/LICENSE.md');
  expect(screen.getByText(/no credit needed/i)).toBeInTheDocument();
  expect(screen.getByText(/please do not present them as your own work/i)).toBeInTheDocument();
  expect(screen.queryByText(/CC BY/)).toBeNull();
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

test('?by=vendor groups the icons by vendor, in vendor name order', async () => {
  await renderRouted(<AppRoutes />, '/icons?by=vendor');
  const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  expect(headings).toEqual(['CTR Electronics', 'REV Robotics', 'Vivid-Hosting']);
  const contents = screen.getByRole('navigation', { name: 'Icon vendors' });
  expect(within(contents).getByRole('link', { name: /REV Robotics/ })).toHaveAttribute('href', '#vendor-rev');
});

test('the group switch shows the current choice and links to the other', async () => {
  await renderRouted(<AppRoutes />, '/icons');
  const group = screen.getByRole('navigation', { name: 'Group icons by' });
  expect(within(group).getByRole('link', { name: 'Type' })).toHaveAttribute('aria-current', 'true');
  expect(within(group).getByRole('link', { name: 'Vendor' })).toHaveAttribute('href', '/icons?by=vendor');
  await settle(() => userEvent.click(within(group).getByRole('link', { name: 'Vendor' })));
  expect(screen.getByTestId('where')).toHaveTextContent('/icons?by=vendor');
  expect(within(group).getByRole('link', { name: 'Vendor' })).toHaveAttribute('aria-current', 'true');
  expect(within(group).getByRole('link', { name: 'Type' })).toHaveAttribute('href', '/icons');
});

test('an unknown ?by= value groups by type', async () => {
  await renderRouted(<AppRoutes />, '/icons?by=color');
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Power', 'Radio and CAN']);
});

test('the search box filters the cards and hides empty sections', async () => {
  await renderRouted(<AppRoutes />, '/icons');
  const box = screen.getByRole('searchbox', { name: 'Search icons' });
  await settle(() => userEvent.type(box, 'canivore'));
  expect(screen.getAllByRole('article').map((a) => a.getAttribute('aria-labelledby'))).toEqual(['icon-canivore']);
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Radio and CAN']);
  expect(screen.getByText('1 of 3 icons')).toHaveAttribute('role', 'status');
  expect(screen.getByTestId('where')).toHaveTextContent('/icons?q=canivore');
});

test('?q= in the URL fills the box, and the chips count the matches', async () => {
  await renderRouted(<AppRoutes />, '/icons?by=vendor&q=ctr');
  expect(screen.getByRole('searchbox', { name: 'Search icons' })).toHaveValue('ctr');
  const contents = screen.getByRole('navigation', { name: 'Icon vendors' });
  expect(within(contents).getAllByRole('link').map((l) => l.textContent)).toEqual(['CTR Electronics 1']);
});

test('a search with no match says so', async () => {
  await renderRouted(<AppRoutes />, '/icons?q=zzz');
  expect(screen.getByText('No icon matches “zzz”.')).toBeInTheDocument();
  expect(screen.queryAllByRole('article')).toHaveLength(0);
});

test('switching the grouping keeps the search', async () => {
  await renderRouted(<AppRoutes />, '/icons?q=rev');
  const group = screen.getByRole('navigation', { name: 'Group icons by' });
  expect(within(group).getByRole('link', { name: 'Vendor' })).toHaveAttribute('href', '/icons?by=vendor&q=rev');
});

test('a Download all link gets every icon as one ZIP', async () => {
  await renderRouted(<AppRoutes />, '/icons');
  const all = screen.getByRole('link', { name: /Download all/ });
  expect(all).toHaveAttribute('href', '/icons/frc-device-icons.zip');
  expect(all).toHaveAttribute('download', 'frc-device-icons.zip');
  expect(all).toHaveTextContent('3 icons');
});

// jsdom has no modal dialog: give it showModal and close (close fires the close event, as a browser does).
function stubDialog() {
  const proto = HTMLDialogElement.prototype as Partial<HTMLDialogElement>;
  proto.showModal = function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
  proto.close = function (this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
  return () => { delete proto.showModal; delete proto.close; };
}

test('a click on a drawing opens it large in a dialog, and Close closes it', async () => {
  const unstub = stubDialog();
  try {
    await renderRouted(<AppRoutes />, '/icons');
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Enlarge the VH-109 Radio drawing' }));
    const dialog = screen.getByRole('dialog', { name: 'VH-109 Radio' });
    expect(within(dialog).getByRole('img', { name: 'Drawing of the VH-109 Radio' }))
      .toHaveAttribute('src', '/icons/communication/vivid-hosting/vh-109.svg');
    expect(within(dialog).getByText('Vivid-Hosting')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /Download/ })).toHaveAttribute('download', 'vh-109.svg');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  } finally {
    unstub();
  }
});

test('a click outside the drawing closes the dialog; a click on the drawing does not', async () => {
  const unstub = stubDialog();
  try {
    await renderRouted(<AppRoutes />, '/icons');
    await userEvent.click(screen.getByRole('button', { name: 'Enlarge the CANivore drawing' }));
    const dialog = screen.getByRole('dialog', { name: 'CANivore' });
    await userEvent.click(within(dialog).getByRole('img'));
    expect(screen.getByRole('dialog', { name: 'CANivore' })).toBeInTheDocument();
    await userEvent.click(dialog); // the target is the dialog itself: the backdrop
    expect(screen.queryByRole('dialog')).toBeNull();
  } finally {
    unstub();
  }
});
