// Fetch content files once per URL. The cache holds the promise, so React 19 use() gets the same promise on
// every render. A failed promise stays cached too, so the error reaches the ErrorBoundary instead of a new fetch
// on every retry render; Retry calls forget() and the next render fetches again.
export const INDEX_URL = '/content/robots.json';

export type ContentFile = 'wiring.json' | 'poster.svg' | 'top-view.svg' | 'scene.json' | 'mechanical.json' | 'controls.json';

export function contentUrl(robot: string, file: ContentFile): string {
  return `/content/robots/${robot}/${file}`;
}

const cache = new Map<string, Promise<unknown>>();

function cached<T>(url: string, read: (r: Response) => Promise<T>): Promise<T> {
  let p = cache.get(url) as Promise<T> | undefined;
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${url} did not load (${r.status} ${r.statusText})`.trim());
      return read(r);
    });
    p.catch(() => {}); // handled by use() and the ErrorBoundary; this only marks it handled
    cache.set(url, p);
  }
  return p;
}

export function loadJson<T>(url: string, validate: (x: unknown) => T): Promise<T> {
  return cached(url, async (r) => validate(await r.json()));
}

export function loadText(url: string): Promise<string> {
  return cached(url, (r) => r.text());
}

/** Drop one cached URL, or all of them. */
export function forget(url?: string): void {
  if (url === undefined) cache.clear();
  else cache.delete(url);
}
