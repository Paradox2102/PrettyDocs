import { pageTitle } from '../shell/paths';
import { useRobot } from '../shell/robot-context';

export default function Viewer3D() {
  const robot = useRobot();
  return (
    <section>
      <title>{pageTitle('3D', robot.name)}</title>
      <h1>3D</h1>
    </section>
  );
}
