// Places callout labels in a column beside a drawing: each label as level with its mark as it can be, in the
// marks' order, at least `gap` apart, and inside [top, bottom].

export function layoutCallouts(items: { id: string; y: number }[], opts: { top: number; bottom: number; gap: number }):
  Map<string, number> {
  const { top, bottom, gap } = opts;
  const sorted = [...items].sort((a, b) => a.y - b.y);
  const out = new Map<string, number>();
  if (sorted.length === 0) return out;
  if ((sorted.length - 1) * gap > bottom - top) {
    const step = sorted.length > 1 ? (bottom - top) / (sorted.length - 1) : 0;
    sorted.forEach((it, i) => out.set(it.id, top + i * step));
    return out;
  }
  const y = sorted.map((it) => it.y);
  for (let i = 0; i < y.length; i++) y[i] = Math.max(y[i], top, i ? y[i - 1] + gap : -Infinity);
  for (let i = y.length - 1; i >= 0; i--) y[i] = Math.min(y[i], i === y.length - 1 ? bottom : y[i + 1] - gap);
  sorted.forEach((it, i) => out.set(it.id, y[i]));
  return out;
}
