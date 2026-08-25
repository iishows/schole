'use client';

/**
 * Classroom Mode B.1 — front-view classroom container.
 *
 * Replaces the RoundTable central bubble area when
 * `isClassroomFrontEnabled()` returns true and `period === 'lesson'`. The
 * sub-components (`<FrontBlackboard />`, `<TeacherStage />`, `<Desks />`,
 * `<WhisperLine />`) read directly from `useStageStore` so no props are
 * passed except where the mockup requires static content (e.g. teacher
 * name "小诺姐姐").
 *
 * Phase B.1 only renders during the lesson period — before-class / break /
 * after-class fall back to V1.1 RoundTable playback (the RoundTable
 * container is the mount target, see app/classroom/[id]/page.tsx).
 *
 * B.1 Task 1 ships the blackboard + teacher stage. The desks grid and
 * whisper line land in Tasks 2 / 3 respectively.
 */

import { useStageStore } from '@/lib/store/stage';
import { isClassroomFrontEnabled } from '@/lib/config/feature-flags';
import { FrontBlackboard } from './blackboard';
import { TeacherStage } from './teacher-stage';
import styles from './classroom-front.module.css';

export function ClassroomFront() {
  const enabled = isClassroomFrontEnabled();
  const period = useStageStore((s) => s.classroom.period);
  const lessonLabel = useStageStore((s) => s.classroom.lessonLabel);

  if (!enabled) return null;
  if (period !== 'lesson') return null;

  return (
    <div className={styles.classroom} data-testid="classroom-front">
      <FrontBlackboard lessonLabel={lessonLabel} />
      <TeacherStage />
      {/* Desks grid (B.1 Task 2) + whisper line (B.1 Task 3) mount here */}
    </div>
  );
}
