import { Suspense } from 'react';
import { useIcons } from '../content/hooks';
import { ErrorBoundary } from './ErrorBoundary';
import styles from './DeviceThumb.module.css';

function Thumb({ slug }: { slug: string }) {
  const icon = useIcons().icons.find((i) => i.slug === slug);
  return icon ? <img className={styles.img} src={`/icons/${icon.path}`} alt="" loading="lazy" /> : null;
}

/** A small copy of a device's icon from the collection. It shows nothing for no slug, an unknown slug, or an icon
 * list that did not load: the table must not depend on it. The name sits next to it, so the picture is decorative. */
export function DeviceThumb({ slug }: { slug: string | null }) {
  return (
    <span className={styles.tile} aria-hidden="true">
      {slug ? (
        <ErrorBoundary title="" fallback={null}>
          <Suspense fallback={null}>
            <Thumb slug={slug} />
          </Suspense>
        </ErrorBoundary>
      ) : null}
    </span>
  );
}
