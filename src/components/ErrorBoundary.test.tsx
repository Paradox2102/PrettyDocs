import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { ErrorBoundary, isChunkLoadError } from './ErrorBoundary';

function Boom({ error }: { error: Error }): never {
  throw error;
}

test('the browsers\' messages for a failed code chunk are recognised', () => {
  expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://d/assets/RobotCanvas-x.js'))).toBe(true);
  expect(isChunkLoadError(new TypeError('error loading dynamically imported module: https://d/assets/x.js'))).toBe(true);
  expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true);
  expect(isChunkLoadError(new Error('Unable to preload CSS for /assets/Viewer3D-x.css'))).toBe(true);
  expect(isChunkLoadError(new Error('/content/robots.json did not load (404 Not Found)'))).toBe(false);
});

test('a failed code chunk says so, and Retry reloads the page', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const reload = vi.fn();
  const onRetry = vi.fn();
  render(
    <ErrorBoundary title="This page's data did not load" onRetry={onRetry} reload={reload}>
      <Boom error={new TypeError('Failed to fetch dynamically imported module: https://d/assets/x.js')} />
    </ErrorBoundary>,
  );
  expect(screen.getByText("This page's code did not load")).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(reload).toHaveBeenCalledTimes(1);
  expect(onRetry).not.toHaveBeenCalled();
});

test('a data error keeps its title, and Retry calls onRetry', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const reload = vi.fn();
  const onRetry = vi.fn();
  render(
    <ErrorBoundary title="This page's data did not load" onRetry={onRetry} reload={reload}>
      <Boom error={new Error('/content/x.json did not load (404 Not Found)')} />
    </ErrorBoundary>,
  );
  expect(screen.getByText("This page's data did not load")).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(onRetry).toHaveBeenCalledTimes(1);
  expect(reload).not.toHaveBeenCalled();
});
