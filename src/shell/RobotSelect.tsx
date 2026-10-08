import { useLocation, useNavigate } from 'react-router';
import { useIndex } from '../content/hooks';
import { pageOf, pagePath } from './paths';
import { useRobot } from './robot-context';
import styles from './Shell.module.css';

/** Native select of all robots. A change keeps the page type when the other robot has that page. */
export function RobotSelect() {
  const index = useIndex();
  const robot = useRobot();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function change(id: string) {
    const target = index.robots.find((r) => r.id === id);
    if (!target) return;
    const page = pageOf(pathname) ?? 'overview';
    navigate(page !== 'overview' && target.docs.includes(page) ? pagePath(id, page) : pagePath(id, 'overview'));
  }

  return (
    <label className={styles.select}>
      <span className={styles.selectLabel}>Robot</span>
      <select value={robot.id} onChange={(e) => change(e.target.value)}>
        {index.robots.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </label>
  );
}
