import styles from './Loading.module.css';

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className={styles.bar} aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
