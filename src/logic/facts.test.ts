import { expect, test } from 'vitest';
import { WIRING } from '../test/fixtures';
import { robotFacts } from './facts';

test('the facts strip counts from the wiring data, in a fixed order', () => {
  expect(robotFacts(WIRING)).toEqual([
    { label: 'Devices', value: 4 },
    { label: 'Motors', value: 2 },
    { label: 'CAN buses', value: 2 },
    { label: 'PDH channels', value: 2 },
    { label: 'Network devices', value: 1 },
    { label: 'Open items', value: 2 },
  ]);
});
