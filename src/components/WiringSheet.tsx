import { useEffect, useEffectEvent, useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import type { Bbox } from '../content/types';
import { centerOn, MODES, panBy, wheelFactor, zoomAt, type Mode, type ViewBox } from '../logic/wiring';
import styles from './WiringSheet.module.css';

export interface SheetHandle {
  fit(): void;
  zoomBy(factor: number): void;
  centerOn(bbox: Bbox): void;
  /** Zoom in to at least FOCUS_ZOOM and put bbox in the middle. */
  focus(bbox: Bbox): void;
}

const FOCUS_ZOOM = 2.5;

interface Props {
  svg: string;
  full: ViewBox;
  mode: Mode;
  openOnly: boolean;
  selected: string | null;
  onSelect: (key: string | null) => void;
  label: string;
  ref?: Ref<SheetHandle>;
}

const DRAG_THRESHOLD = 3; // px of pointer travel before a press becomes a pan instead of a click

/**
 * One wiring sheet (the poster or the top view) as inline SVG, with zoom (wheel, pinch, buttons) and pan (drag).
 * The SVG text is trusted content from this repo. React sets it once; after that only classes and the viewBox
 * change, so the 200 kB sheet is not re-parsed on every interaction.
 */
export function WiringSheet({ svg, full, mode, openOnly, selected, onSelect, label, ref }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<ViewBox>(full);
  const html = useMemo(() => ({ __html: svg }), [svg]);
  const root = () => host.current?.querySelector<SVGSVGElement>(':scope > svg') ?? null;

  function setView(v: ViewBox) {
    view.current = v;
    root()?.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`);
  }

  // A new sheet: fill the box and start at the whole sheet.
  useEffect(() => {
    const s = root();
    if (!s) return;
    s.removeAttribute('width');
    s.removeAttribute('height');
    s.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    setView({ ...full });
  }, [svg, full]);

  useEffect(() => {
    const s = root();
    if (!s) return;
    for (const m of MODES) s.classList.toggle(`mode-${m}`, m === mode && m !== 'all');
    s.classList.toggle('open-only', openOnly);
  }, [svg, mode, openOnly]);

  useEffect(() => {
    const s = root();
    if (!s) return;
    s.querySelectorAll('g.hl.on').forEach((g) => g.classList.remove('on'));
    if (selected) s.querySelector(`g.hl[data-key="${CSS.escape(selected)}"]`)?.classList.add('on');
  }, [svg, selected]);

  const middle = () => ({ x: view.current.x + view.current.w / 2, y: view.current.y + view.current.h / 2 });
  useImperativeHandle(ref, () => ({
    fit: () => setView({ ...full }),
    zoomBy: (f) => { const c = middle(); setView(zoomAt(view.current, f, c.x, c.y, full)); },
    centerOn: (bbox) => setView(centerOn(view.current, bbox, full)),
    focus: (bbox) => {
      const w = Math.min(view.current.w, full.w / FOCUS_ZOOM);
      setView(centerOn({ ...view.current, w, h: (w * full.h) / full.w }, bbox, full));
    },
  }));

  const select = useEffectEvent((key: string | null) => onSelect(key));

  // Wheel zoom, drag pan and two-finger pinch. Listeners are attached by hand: React's wheel listener is passive.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const toSheet = (cx: number, cy: number, m?: DOMMatrix) => {
      const s = root();
      const matrix = m ?? s?.getScreenCTM()?.inverse();
      if (!s || !matrix) return null;
      return new DOMPoint(cx, cy).matrixTransform(matrix);
    };

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const p = toSheet(e.clientX, e.clientY);
      const f = wheelFactor(e.deltaY, e.deltaMode);
      if (p && f !== 1) setView(zoomAt(view.current, f, p.x, p.y, full));
    }

    const pointers = new Map<number, { x: number; y: number }>();
    let drag: { start: ViewBox; m: DOMMatrix; x: number; y: number } | null = null;
    let pinch: { dist: number } | null = null;
    let moved = false;

    function onDown(e: PointerEvent) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const m = root()?.getScreenCTM()?.inverse();
      if (pointers.size === 1 && m) {
        drag = { start: view.current, m, x: e.clientX, y: e.clientY };
        moved = false;
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) };
        drag = null;
        moved = true;
      }
    }

    function onMove(e: PointerEvent) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = toSheet((a.x + b.x) / 2, (a.y + b.y) / 2);
        if (mid && pinch.dist > 0) setView(zoomAt(view.current, dist / pinch.dist, mid.x, mid.y, full));
        pinch.dist = dist;
        return;
      }
      if (!drag) return;
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > DRAG_THRESHOLD) {
        if (!moved) el?.setPointerCapture?.(e.pointerId);
        moved = true;
      }
      if (!moved) return;
      const a = toSheet(drag.x, drag.y, drag.m);
      const b = toSheet(e.clientX, e.clientY, drag.m);
      if (a && b) setView(panBy(drag.start, a.x - b.x, a.y - b.y, full));
      el?.classList.add(styles.dragging);
    }

    function onUp(e: PointerEvent) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) {
        drag = null;
        el?.classList.remove(styles.dragging);
      }
    }

    function onClick(e: MouseEvent) {
      if (moved) {
        moved = false;
        return;
      }
      const g = (e.target as Element).closest('[data-key]');
      select(g ? g.getAttribute('data-key') : null);
    }

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('click', onClick);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('click', onClick);
    };
  }, [full]);

  return <div ref={host} className={`${styles.sheet} wiring-sheet`} aria-label={label} role="group"
    dangerouslySetInnerHTML={html} />;
}
