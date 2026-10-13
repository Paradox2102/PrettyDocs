import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { useIcons } from '../content/hooks';
import type { IconRecord } from '../content/types';
import { filterIcons, groupBy, groupIcons, type GroupBy } from '../logic/icons';
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
  const { hash } = useLocation();
  const [params, setParams] = useSearchParams();
  const by = groupBy(params.get('by'));
  // The box keeps its own value: the router applies a URL change a moment later, and a box that read the URL
  // would lose letters typed in between. The URL follows the box, so a search can be shared.
  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const shown = filterIcons(index, query);
  const groups = groupIcons(shown, by);
  // The group switch keeps the search; typing replaces the history entry instead of adding one per key.
  const linkTo = (b: GroupBy) => {
    const next = new URLSearchParams(b === 'vendor' ? { by: 'vendor' } : {});
    if (query) next.set('q', query);
    return next.size ? `/icons?${next}` : '/icons';
  };
  const search = (q: string) => {
    setQuery(q);
    setParams((p) => {
      const next = new URLSearchParams(p);
      if (q) next.set('q', q);
      else next.delete('q');
      return next;
    }, { replace: true });
  };
  // The browser jumps to a #section before the list has loaded, when the section is not there yet. This page
  // renders only after useIcons() has its data, so scroll here.
  useEffect(() => {
    if (hash.length > 1) document.getElementById(hash.slice(1))?.scrollIntoView(); // ids are plain a-z0-9-
  }, [hash, by]);
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
          Drawn by {index.attribution}. Public domain under <a href={`${ICONS_BASE}LICENSE.md`}>CC0 1.0</a>: use
          them for anything, no credit needed. Please do not present them as your own work. Scripts can read{' '}
          <a href={`${ICONS_BASE}index.json`}>index.json</a> for each icon's size and wire ends.
        </p>
        <nav aria-label="Group icons by" className={styles.switch}>
          <span className={styles.switchLabel}>Group by</span>
          {(['type', 'vendor'] as GroupBy[]).map((b) => (
            <Link key={b} to={linkTo(b)} aria-current={b === by ? 'true' : undefined}
              className={b === by ? `${styles.switchItem} ${styles.switchOn}` : styles.switchItem}>
              {b === 'type' ? 'Type' : 'Vendor'}
            </Link>
          ))}
        </nav>
        <div className={styles.searchRow}>
          <input type="search" className={styles.search} aria-label="Search icons" placeholder="Name, vendor or part number"
            autoComplete="off" spellCheck={false} value={query} onChange={(e) => search(e.target.value)} />
          <p role="status" className={styles.status}>
            {query ? `${shown.icons.length} of ${index.icons.length} icons` : `${index.icons.length} icons`}
          </p>
        </div>
        <nav aria-label={by === 'vendor' ? 'Icon vendors' : 'Icon types'}>
          <ul className={styles.contents}>
            {groups.map((g) => (
              <li key={g.id}>
                <a href={`#${g.id}`}>{g.name} <span className={styles.count}>{g.icons.length}</span></a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      {query && groups.length === 0 && <p className={styles.empty}>No icon matches “{query}”.</p>}
      {groups.map((g) => (
        <section key={g.id} id={g.id} className={styles.section} aria-labelledby={`group-${g.id}`}>
          <h2 id={`group-${g.id}`} className={styles.sectionTitle}>{g.name}</h2>
          <div className={styles.grid}>
            {g.icons.map((i) => <IconCard key={i.slug} icon={i} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
