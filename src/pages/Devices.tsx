import { pageTitle } from '../shell/paths';
import { useRobot } from '../shell/robot-context';

export default function Devices() {
  const robot = useRobot();
  return (
    <section>
      <title>{pageTitle('Devices', robot.name)}</title>
      <h1>Devices</h1>
    </section>
  );
}
