import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { driveShade, GROUP_COLORS } from '../logic/viewer';
import { DriveKey } from './DriveKey';

test('with a mechanism, the key shows its color and the darker power-transfer shade', () => {
  render(<DriveKey group="shooter" />);
  const key = screen.getByText(/darker shade: power transfer \(gears, pulleys, belts, shafts, wheels, rollers\)/i);
  const swatches = key.querySelectorAll('span');
  expect(swatches[0]).toHaveStyle({ background: GROUP_COLORS.shooter });
  expect(swatches[1]).toHaveStyle({ background: driveShade(GROUP_COLORS.shooter) });
});

test('without a mechanism, the key is text only', () => {
  render(<DriveKey />);
  expect(screen.getByText(/darker shade of their mechanism's color/).querySelectorAll('span')).toHaveLength(0);
});
