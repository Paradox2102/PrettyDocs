import { pageTitle } from '../shell/paths';
import { useRobot } from '../shell/robot-context';

export default function Overview() {
  const robot = useRobot();
  return (
    <section>
      <title>{pageTitle(null, robot.name)}</title>
      <h1>{robot.name}</h1>
    </section>
  );
}
