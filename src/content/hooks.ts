// Content hooks. Each suspends until its file arrives; wrap callers in <Suspense> and an ErrorBoundary.
import { use } from 'react';
import type { Sheet } from '../logic/wiring';
import { contentUrl, INDEX_URL, loadJson, loadText } from './load';
import type { RobotIndex, Scene, WiringData } from './types';
import { validateIndex, validateScene, validateWiring } from './validate';

export function useIndex(): RobotIndex {
  return use(loadJson(INDEX_URL, validateIndex));
}

export function useWiring(robot: string): WiringData {
  return use(loadJson(contentUrl(robot, 'wiring.json'), validateWiring));
}

export function useSheetSvg(robot: string, sheet: Sheet): string {
  return use(loadText(contentUrl(robot, sheet === 'top' ? 'top-view.svg' : 'poster.svg')));
}

export function useScene(robot: string): Scene {
  return use(loadJson(contentUrl(robot, 'scene.json'), validateScene));
}
