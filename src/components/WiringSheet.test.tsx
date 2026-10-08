import { fireEvent, render } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { WiringSheet } from './WiringSheet';

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" width="100mm" height="50mm">'
  + '<g data-key="a" data-info="can"><rect x="1" y="1" width="5" height="5"/></g>'
  + '<g class="hl" data-key="a" display="none"><rect x="0" y="0" width="7" height="7"/></g>'
  + '<rect id="empty" x="50" y="20" width="5" height="5"/></svg>';
const FULL = { x: 0, y: 0, w: 100, h: 50 };

function setup(props: Partial<Parameters<typeof WiringSheet>[0]> = {}) {
  const onSelect = vi.fn();
  const r = render(<WiringSheet svg={SVG} full={FULL} mode="all" openOnly={false} selected={null}
    onSelect={onSelect} label="Wiring sheet" {...props} />);
  const svg = r.container.querySelector('svg')!;
  return { ...r, svg, onSelect };
}

test('a mode puts its class on the root svg', () => {
  const { svg, rerender, onSelect } = setup({ mode: 'can' });
  expect(svg).toHaveClass('mode-can');
  rerender(<WiringSheet svg={SVG} full={FULL} mode="all" openOnly={false} selected={null} onSelect={onSelect} label="x" />);
  expect(svg).not.toHaveClass('mode-can');
});

test('openOnly puts open-only on the root svg', () => {
  expect(setup({ openOnly: true }).svg).toHaveClass('open-only');
});

test('the selected device highlight is on', () => {
  const { container } = setup({ selected: 'a' });
  expect(container.querySelector('g.hl[data-key="a"]')).toHaveClass('on');
});

test('the svg fills the sheet with the full view box', () => {
  const { svg } = setup();
  expect(svg.getAttribute('width')).toBeNull();
  expect(svg.getAttribute('viewBox')).toBe('0 0 100 50');
  expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
});

test('a click on a device selects it; a click on empty sheet clears', () => {
  const { container, onSelect } = setup();
  fireEvent.click(container.querySelector('[data-key="a"] rect')!);
  expect(onSelect).toHaveBeenLastCalledWith('a');
  fireEvent.click(container.querySelector('#empty')!);
  expect(onSelect).toHaveBeenLastCalledWith(null);
});
