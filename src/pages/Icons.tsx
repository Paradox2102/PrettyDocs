import { useIcons } from '../content/hooks';
import type { IconRecord } from '../content/types';
import styles from './Icons.module.css';

const ICONS_BASE = '/icons/';

function IconCard({ icon }: { icon: IconRecord }) {
  const url = ICONS_BASE + icon.path;
  const titleId = `icon-${icon.slug}`;
  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <div className={styles.tile}>
        <img src={url} alt={`Drawing of the ${icon.name}`} loading="lazy" />
      </div>
      <div className={styles.meta}>
        <h3 id={titleId} className={styles.name}>{icon.name}</h3>
        <p className={styles.vendor}>{icon.vendor_name}</p>
        {icon.status === 'legacy' && <p className={styles.legacy}>Legacy: not sold now</p>}
        <a className={styles.download} href={url} download={`${icon.slug}.svg`}>
          Download SVG<span className="visually-hidden"> of {icon.name}</span>
        </a>
      </div>
    </article>
  );
}

/** The FRC device icon gallery: every icon of /icons/index.json, one section per type. */
export default function Icons() {
  const index = useIcons();
  return (
    <div className={styles.page}>
      <title>Device icons · Team 2102</title>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Team 2102 · Paradox</p>
        <h1 className={styles.title}>FRC device icons</h1>
        <p className={styles.lead}>
          {index.icons.length} SVG drawings of common FRC robot devices, made for wiring diagrams. One SVG unit is one
          millimetre, so all the icons have the same scale. Each wire end is a hidden anchor circle that a diagram can
          attach a wire to.
        </p>
        <p className={styles.lead}>
          Free to use under <a href={`${ICONS_BASE}LICENSE.md`}>CC BY 4.0</a>. Credit: “Device icons by{' '}
          {index.attribution}”. Scripts can read <a href={`${ICONS_BASE}index.json`}>index.json</a> for each icon's
          size and wire ends.
        </p>
        <nav aria-label="Icon types">
          <ul className={styles.contents}>
            {index.types.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`}>{t.name} <span className={styles.count}>{t.count}</span></a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      {index.types.map((t) => (
        <section key={t.id} id={t.id} className={styles.section} aria-labelledby={`type-${t.id}`}>
          <h2 id={`type-${t.id}`} className={styles.sectionTitle}>{t.name}</h2>
          <div className={styles.grid}>
            {index.icons.filter((i) => i.type === t.id).map((i) => <IconCard key={i.slug} icon={i} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
