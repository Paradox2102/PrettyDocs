import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { PdhTag } from './PdhTag';

test('a PDH channel is a lightning bolt and the channel, in place of "ch" (user, 2026-10-08)', () => {
  render(<PdhTag text="12" />);
  const tag = screen.getByText('12');
  expect(tag.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  // As tall as the digits: the JetBrains Mono cap height, 0.73 em, in the bolt's 10 x 16 box (user, 2026-10-08).
  expect(tag.querySelector('svg')).toHaveAttribute('height', '0.73em');
  expect(tag.querySelector('svg')).toHaveAttribute('width', '0.46em');
  expect(tag).toHaveTextContent(/^12$/);
});

test('no channel text: nothing', () => {
  const { container } = render(<PdhTag text="" />);
  expect(container).toBeEmptyDOMElement();
});
