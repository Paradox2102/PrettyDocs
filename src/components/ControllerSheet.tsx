import type { KeyboardEvent } from 'react';
import type { ControllerModel, Mark, ViewDef } from '../controllers/types';
import type { Binding } from '../content/types';
import { layoutCallouts } from '../logic/callouts';
import { howLabel } from '../logic/controls';
import styles from './ControllerSheet.module.css';

interface Props {
  model: ControllerModel;
  view: ViewDef;
  bindings: Map<string, Binding>;
  selected: string | null;
  onSelect: (input: string) => void;
  /** Phone width: no callouts, the body fills the drawing. */
  compact?: boolean;
}

/** Callout column width and the gaps around it, in drawing units (mm). */
const COLUMN = 80;
const ELBOW = 5;
const TEXT = 12;
const GAP = 15;

/**
 * One view of a controller as SVG: the body, a mark per input (accent when bound), and callouts with leader lines in
 * two columns beside the body. Marks are buttons; the callouts repeat them for the mouse only.
 */
export function ControllerSheet({ model, view, bindings, selected, onSelect, compact = false }: Props) {
  const [x0, y0, x1, y1] = view.box;
  const inputs = new Map(model.inputs.map((n) => [n.id, n]));
  const viewBox = compact
    ? [x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12]
    : [x0 - TEXT - COLUMN, y0 - 12, x1 - x0 + 2 * (TEXT + COLUMN), y1 - y0 + 24];
  const column = (side: 'left' | 'right') => layoutCallouts(
    view.marks.filter((m) => m.side === side).map((m) => ({ id: m.input, y: m.y })),
    { top: y0 - 4, bottom: y1 + 4, gap: GAP });
  const labelY = { left: column('left'), right: column('right') };

  const keys = (input: string) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(input);
    }
  };

  return (
    <svg className={styles.sheet} viewBox={viewBox.join(' ')} role="group" aria-label={`${model.name}, ${view.title}`}>
      {view.paths.map((p, i) => <path key={i} d={p.d} className={p.tone === 'body' ? styles.body : styles.part} />)}

      {compact ? null : view.marks.map((m) => {
        const b = bindings.get(m.input);
        const input = inputs.get(m.input)!;
        const ly = labelY[m.side].get(m.input)!;
        const left = m.side === 'left';
        const ex = left ? x0 - ELBOW : x1 + ELBOW;
        const tx = left ? x0 - TEXT : x1 + TEXT;
        const cls = [styles.callout, b ? styles.bound : '', selected === m.input ? styles.selected : ''].join(' ');
        return (
          <g key={`c-${m.input}`} className={cls} aria-hidden="true" onClick={() => onSelect(m.input)}>
            <polyline points={`${m.x},${m.y} ${ex},${ly} ${tx - 1},${ly}`} className={styles.leader} />
            <circle cx={m.x} cy={m.y} r={0.9} className={styles.dot} />
            <text x={tx} y={ly} textAnchor={left ? 'end' : 'start'}>
              {b ? (
                <>
                  <tspan className={styles.label} x={left ? tx - 1 : tx + 1} dy="-0.6">{b.label}</tspan>
                  <tspan className={styles.sub} x={left ? tx - 1 : tx + 1} dy="6.2">{`${input.short} · ${howLabel(b, input)}`}</tspan>
                </>
              ) : (
                <tspan className={styles.unused} x={left ? tx - 1 : tx + 1} dy="1.6">{`${input.short} · not used`}</tspan>
              )}
            </text>
          </g>
        );
      })}

      {view.marks.map((m) => {
        const b = bindings.get(m.input);
        const input = inputs.get(m.input)!;
        const on = selected === m.input;
        const cls = [styles.mark, b ? styles.bound : '', on ? styles.selected : ''].join(' ');
        return (
          <g key={m.input} className={cls} role="button" tabIndex={0} aria-pressed={on}
            aria-label={`${input.name}: ${b ? b.label : 'not used'}`} onClick={() => onSelect(m.input)} onKeyDown={keys(m.input)}>
            <MarkShape m={m} />
            {m.glyph ? <text x={m.x} y={m.y} className={styles.glyph} dy="1.5">{m.glyph}</text> : null}
          </g>
        );
      })}
    </svg>
  );
}

function MarkShape({ m }: { m: Mark }) {
  if (m.shape === 'circle') return <circle cx={m.x} cy={m.y} r={m.r} className={styles.shape} />;
  if (m.shape === 'rect') {
    return <rect x={m.x - m.w! / 2} y={m.y - m.h! / 2} width={m.w} height={m.h} rx={1.5} className={styles.shape} />;
  }
  // An open path (an arrow) is drawn as a line, with a wide clear stroke to click on.
  const open = !m.d!.trim().endsWith('Z');
  return open ? (
    <>
      <path d={m.d} className={styles.hit} />
      <path d={m.d} className={`${styles.shape} ${styles.line}`} />
    </>
  ) : <path d={m.d} className={styles.shape} fillRule="evenodd" />;
}
