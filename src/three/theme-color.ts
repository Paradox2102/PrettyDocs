import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const mq = matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', onChange);
  return () => {
    mo.disconnect();
    mq.removeEventListener('change', onChange);
  };
}

/** The current value of a CSS color token, for WebGL objects that cannot read CSS. Follows theme changes. */
export function useCssColor(name: string): string {
  return useSyncExternalStore(subscribe, () => getComputedStyle(document.documentElement).getPropertyValue(name).trim());
}

function subscribeMotion(onChange: () => void) {
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, () => matchMedia('(prefers-reduced-motion: reduce)').matches);
}
