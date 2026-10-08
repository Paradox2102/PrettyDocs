import { Link } from 'react-router';
import { PdhTag } from '../components/PdhTag';
import { Segmented } from '../components/Segmented';
import { SubsystemView } from '../components/SubsystemView';
import { useMechanical, useWiring } from '../content/hooks';
import { subsystemDevices } from '../logic/mechanical';
import { MOTOR } from '../logic/wiring';
import { formatBuilt, pagePath, pageTitle } from '../shell/paths';
import { useRobot } from '../shell/robot-context';
import { useUrlState } from '../shell/url-state';
import styles from './Mechanical.module.css';

export default function Mechanical() {
  const robot = useRobot();
  const mech = useMechanical(robot.id);
  const wiring = useWiring(robot.id);
  const { hash, update } = useUrlState();
  const wanted = hash.replace(/^#/, '');
  const sub = mech.subsystems.find((s) => s.id === wanted) ?? mech.subsystems[0];
  const devices = subsystemDevices(wiring, sub);
  const has3d = robot.docs.includes('3d');

  return (
    <div className={styles.page}>
      <title>{pageTitle('Mechanical', robot.name)}</title>
      <header className={styles.head}>
        <p className={styles.eyebrow}>{robot.name}</p>
        <h1 className={styles.h1}>Mechanical</h1>
        <p className={styles.lead}>Ratios, current limits, devices and service notes for each subsystem.</p>
        <div className={styles.switch}>
          <Segmented label="Subsystem" name="subsystem" value={sub.id}
            options={mech.subsystems.map((s) => ({ value: s.id, label: s.name }))}
            onChange={(id) => update({ hash: `#${id}` })} />
        </div>
      </header>

      <div className={has3d ? styles.body : `${styles.body} ${styles.no3d}`}>
        <section className={styles.text} aria-labelledby="sub-h">
          <h2 id="sub-h" className={styles.h2}>{sub.name}</h2>
          <p className={styles.summary}>{sub.summary}</p>

          <h3 className={styles.h3}>Facts</h3>
          <dl className={styles.facts}>
            {sub.facts.map((f) => (
              <div key={f.label} className={f.uncertain ? `${styles.fact} ${styles.uncertain}` : styles.fact}>
                <dt>{f.label}</dt>
                <dd>
                  <span className={styles.value}>{f.value}</span>
                  {f.uncertain ? <span className={styles.reason}>{f.uncertain}</span> : null}
                  <span className={styles.source}>{f.source}</span>
                </dd>
              </div>
            ))}
          </dl>

          <h3 className={styles.h3}>Devices</h3>
          {devices.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table} aria-label={`${sub.name} devices`}>
                <thead>
                  <tr><th scope="col">Device</th><th scope="col">CAN</th><th scope="col">Type</th><th scope="col">PDH</th><th scope="col">Open items</th></tr>
                </thead>
                <tbody>
                  {devices.map((d) => (
                    <tr key={d.key}>
                      <td data-label="Device" className={styles.deviceCell}><Link to={`${pagePath(robot.id, 'wiring')}?device=${encodeURIComponent(d.key)}`}>{d.role || d.key}</Link></td>
                      <td data-label="CAN" className="mono">{d.can ? `${d.can.bus} · ${d.can.id ?? '?'}` : ''}</td>
                      <td data-label="Type">{[d.type, d.icon ? MOTOR[d.icon] : null].filter(Boolean).join(' · ')}</td>
                      <td data-label="PDH" className={d.derived.pdh_tag[1] === 'amber' ? `mono ${styles.amberText}` : 'mono'}><PdhTag text={d.derived.pdh_tag[0]} /></td>
                      <td data-label="Open items" className={`${styles.amberText} ${styles.openCell}`}>{d.derived.open_reasons.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className={styles.empty}>No devices found for this subsystem.</p>}

          <h3 className={styles.h3}>Service notes</h3>
          {sub.notes.length ? (
            <ul className={styles.notes}>{sub.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          ) : <p className={styles.empty}>No service notes yet.</p>}

          <p className={styles.updated}>Facts updated {formatBuilt(mech.updated)}</p>
        </section>

        {has3d ? (
          <div className={styles.view}>
            <SubsystemView robot={robot.id} groups={sub.groups} devices={devices.map((d) => d.key)}
              label={`${sub.name} in 3D`} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
