import type { ReactNode } from 'react';
import { Navigate, useLocation, useParams } from 'react-router';
import { useIndex } from '../content/hooks';
import type { DocKind } from '../content/types';
import { NotFound } from '../pages/NotFound';
import { Layout } from './Layout';
import { RobotContext, useRobot } from './robot-context';

/** Finds the robot of the URL: a mixed-case id redirects to the lowercase id; an unknown id is "Robot not found". */
export function RobotRoute() {
  const index = useIndex();
  const { robot: id = '' } = useParams();
  const location = useLocation();
  const robot = index.robots.find((r) => r.id === id);
  if (!robot) {
    const lower = id.toLowerCase();
    if (lower !== id && index.robots.some((r) => r.id === lower)) {
      const rest = location.pathname.replace(/^\/[^/]+/, `/${lower}`);
      return <Navigate to={rest + location.search + location.hash} replace />;
    }
    return <NotFound kind="robot" />;
  }
  return (
    <RobotContext value={robot}>
      <Layout />
    </RobotContext>
  );
}

/** Renders its page only when the robot has that doc; otherwise "Page not found". */
export function DocGate({ doc, children }: { doc: DocKind; children: ReactNode }) {
  const robot = useRobot();
  return robot.docs.includes(doc) ? children : <NotFound kind="page" />;
}

export function LatestRedirect() {
  const index = useIndex();
  return <Navigate to={`/${index.latest}`} replace />;
}
