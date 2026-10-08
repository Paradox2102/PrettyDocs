import { Link } from 'react-router';
import { useIndex } from '../content/hooks';
import styles from './NotFound.module.css';

/** "Robot not found" (unknown robot id) or "Page not found" (unknown page), with links to every robot. */
export function NotFound({ kind }: { kind: 'robot' | 'page' }) {
  const index = useIndex();
  const title = kind === 'robot' ? 'Robot not found' : 'Page not found';
  return (
    <section className={styles.wrap}>
      <title>{`${title} · Team 2102`}</title>
      <p className={styles.code}>404</p>
      <h1>{title}</h1>
      <p className={styles.lead}>
        {kind === 'robot' ? 'There are no docs for that robot. These robots have docs:' : 'That page does not exist. Pick a robot:'}
      </p>
      <ul className={styles.list}>
        {index.robots.map((r) => (
          <li key={r.id}>
            <Link to={`/${r.id}`}>{r.name}</Link>
            <span className={styles.season}>{r.id === index.latest ? 'latest' : r.season}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
