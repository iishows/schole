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
import { Desks } from './desks';
import { WhisperLine } from './whisper-line';
import styles from './classroom-front.module.css';

/** B.1.2 — optional demo props forwarded from `/classroom-demo`.
 *  When any of these are supplied the B.1 default mockup-faithful
 *  content is overridden. */
export interface ClassroomFrontDemoProps {
  teacherBubbleContent?: string;
  deskBubbleContents?: Record<string, string>;
  deskDisplayNames?: Record<string, string>;
  deskHandRaised?: Record<string, boolean>;
  activeCallOnAgentId?: string | null;
}

export function ClassroomFront(demo: ClassroomFrontDemoProps = {}) {
  const enabled = isClassroomFrontEnabled();
  const period = useStageStore((s) => s.classroom.period);
  const lessonLabel = useStageStore((s) => s.classroom.lessonLabel);

  if (!enabled) return null;
  if (period !== 'lesson') return null;

  return (
    <div className={styles.classroom} data-testid="classroom-front">
      <WhisperLine />
      <FrontBlackboard lessonLabel={lessonLabel} />
      <TeacherStage bubbleContent={demo.teacherBubbleContent} />
      <Desks
        deskBubbleContents={demo.deskBubbleContents}
        deskDisplayNames={demo.deskDisplayNames}
        deskHandRaised={demo.deskHandRaised}
        activeCallOnAgentId={demo.activeCallOnAgentId}
      />
    </div>
  );
}
