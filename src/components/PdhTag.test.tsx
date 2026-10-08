import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { PdhTag } from './PdhTag';

test('a PDH channel is a lightning bolt and the channel, in place of "ch" (user, 2026-10-08)', () => {
  render(<PdhTag text="12" />);
  const tag = screen.getByText('12');
  expect(tag.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  expect(tag).toHaveTextContent(/^12$/);
});

test('no channel text: nothing', () => {
  const { container } = render(<PdhTag text="" />);
  expect(container).toBeEmptyDOMElement();
});
