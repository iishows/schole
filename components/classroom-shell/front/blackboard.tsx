'use client';

/**
 * Front-view blackboard (整面投影). Reads `blackboardMode` + `chalkStrokes`
 * from the store and reuses the V1 `buildChalkSvg` helper to render the
 * chalk stroke buffer. The SVG `<defs>` block defining `chalk-rough` (the
 * turbulence filter that gives strokes a chalky texture) lives INSIDE the
 * boardSvg so the filter is namespaced to this single mount.
 */

import { useStageStore } from '@/lib/store/stage';
import { buildChalkSvg } from '@/lib/utils/chalk-stroke-svg';
import type { ChalkStroke } from '@/lib/utils/chalk-stroke-svg';
import styles from './classroom-front.module.css';

export interface FrontBlackboardProps {
  lessonLabel: string;
}

export function FrontBlackboard({ lessonLabel }: FrontBlackboardProps) {
  const blackboardMode = useStageStore((s) => s.classroom.blackboardMode);
  const strokes = useStageStore((s) => (s.classroom.chalkStrokes ?? []) as ChalkStroke[]);
  if (!blackboardMode) return null;
  return (
    <div className={styles.blackboard} data-testid="front-blackboard">
      <span className={styles.boardStep}>{lessonLabel || '本节课'}</span>
      <span className={styles.boardStepActive}>① 学习中</span>
      <svg
        className={styles.boardSvg}
        viewBox="0 0 600 200"
        preserveAspectRatio="none"
        data-testid="front-blackboard-svg"
      >
        <defs>
          <filter id="chalk-rough-front">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
            <feDisplacementMap in="SourceGraphic" scale="2" />
          </filter>
        </defs>
        <g dangerouslySetInnerHTML={{ __html: buildChalkSvg(strokes) }} />
      </svg>
    </div>
  );
}
