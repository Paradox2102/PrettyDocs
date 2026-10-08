import { createContext, useContext } from 'react';
import type { RobotEntry } from '../content/types';

export const RobotContext = createContext<RobotEntry | null>(null);

export function useRobot(): RobotEntry {
  const robot = useContext(RobotContext);
  if (!robot) throw new Error('useRobot() outside a robot route');
  return robot;
}
