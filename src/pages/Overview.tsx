import { Link } from 'react-router';
import { RobotHero } from '../components/RobotHero';
import { useWiring } from '../content/hooks';
import type { DocKind } from '../content/types';
import { robotFacts } from '../logic/facts';
import { PageIcon } from '../shell/icons';
import { formatBuilt, pagePath, pageTitle } from '../shell/paths';
import { useRobot } from '../shell/robot-context';
import styles from './Overview.module.css';

const CARDS: Record<DocKind, { title: string; text: string }> = {
  wiring: { title: 'Wiring', text: 'CAN, power and network on one sheet, and a top view with every device at its CAD position.' },
  '3d': { title: '3D', text: 'The CAD model with each CAN loop, power cable and network link drawn in place.' },
  devices: { title: 'Devices', text: 'Every device with its CAN ID, PDH channel and IP address. Search, filter and sort.' },
  mechanical: { title: 'Mechanical', text: 'Swerve, intake and shooter: ratios, current limits, devices and service notes.' },
  controls: { title: 'Controls', text: 'What each button on the driver gamepad and the joystick does, drawn front, back and in 3D.' },
};

export default function Overview() {
  const robot = useRobot();
  const wiring = useWiring(robot.id);
  const facts = robotFacts(wiring);
  const open = facts.find((f) => f.label === 'Open items')?.value ?? 0;
  const has3d = robot.docs.includes('3d');

  return (
    <div className={styles.page}>
      <title>{pageTitle(null, robot.name)}</title>
      <section className={has3d ? styles.top : `${styles.top} ${styles.noHero}`}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Team 2102 · Paradox</p>
          <h1 className={styles.name}>{robot.name}</h1>
          <p className={styles.season}>Season {robot.season} · data built {formatBuilt(robot.built)}</p>
          <p className={styles.summary}>{robot.summary}</p>
          <ul className={styles.facts} aria-label="Robot facts">
            {facts.map((f) => (
              <li key={f.label}>
                <span className={styles.factValue}>{f.value}</span>
                <span className={styles.factLabel}>{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
        {has3d ? <RobotHero robot={robot.id} /> : null}
      </section>

      <section aria-labelledby="docs-h" className={styles.docs}>
        <h2 id="docs-h" className={styles.h2}>Docs</h2>
        <div className={styles.cards}>
          {robot.docs.map((d) => (
            <Link key={d} to={pagePath(robot.id, d)} className={styles.card}>
              <span className={styles.cardHead}>
                <PageIcon page={d} />
                <span className={styles.cardTitle}>{CARDS[d].title}</span>
                <span className={styles.arrow} aria-hidden="true">→</span>
              </span>
              <span className={styles.cardText}>{CARDS[d].text}</span>
            </Link>
          ))}
          {open > 0 && robot.docs.includes('wiring') ? (
            <Link to={`${pagePath(robot.id, 'wiring')}?open=1`} className={`${styles.card} ${styles.openCard}`}>
              <span className={styles.cardHead}>
                <span className={styles.cardTitle}>{open} open items</span>
                <span className={styles.arrow} aria-hidden="true">→</span>
              </span>
              <span className={styles.cardText}>
                Facts still to check on the robot: CAN IDs not confirmed, PDH channels not recorded, assumed ports and pairings.
              </span>
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
