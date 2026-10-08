import { pageTitle } from '../shell/paths';
import { useRobot } from '../shell/robot-context';

export default function Wiring() {
  const robot = useRobot();
  return (
    <section>
      <title>{pageTitle('Wiring', robot.name)}</title>
      <h1>Wiring</h1>
    </section>
  );
}
