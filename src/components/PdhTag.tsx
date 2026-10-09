import styles from './PdhTag.module.css';

/** A lightning bolt in a 10 x 16 box; Labels.css draws the same shape on the 3D power tags. */
export const BOLT_PATH = 'M6.5 0L1 9H4.6L3.4 16L9 6.6H5.4L7.4 0Z';

/**
 * A PDH channel: a lightning bolt in the power red, then the channel ("12", "10?", "21") (user, 2026-10-08).
 * The bolt is as tall as the digits (the JetBrains Mono cap height, 0.73 em) and stands on their baseline.
 */
export function PdhTag({ text }: { text: string }) {
  if (!text) return null;
  return (
    <span className={styles.tag}>
      <svg className={styles.bolt} width="0.46em" height="0.73em" viewBox="0 0 10 16" aria-hidden="true">
        <path d={BOLT_PATH} fill="currentColor" />
      </svg>
      {text}
    </span>
  );
}
