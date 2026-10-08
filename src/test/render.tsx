// Render helpers for components that suspend on content: React 19's async act() waits for the use()d promises,
// so the assertions after these helpers see the loaded page.
import { act, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, useLocation } from 'react-router';

export function Where() {
  const l = useLocation();
  return <output data-testid="where">{l.pathname + l.search + l.hash}</output>;
}

export async function renderRouted(ui: ReactElement, path: string) {
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <MemoryRouter initialEntries={[path]}>
        {ui}
        <Where />
      </MemoryRouter>,
    );
  });
  return result;
}

/** Run a user action (click, type, select) and wait for any data it loads. */
export async function settle(action: () => Promise<unknown>) {
  await act(async () => {
    await action();
  });
}
