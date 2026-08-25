'use client';

/**
 * Teacher stage — podium + teacher avatar + speech bubble. The teacher
 * avatar name ("小诺姐姐") is hardcoded for B.1 — V1.1's agent registry
 * does not yet surface a teacher agent id, so a constant name keeps the
 * visual mockup-faithful without adding state fields.
 *
 * B.1.1: also renders the mockup's `.teacher-bubble` div next to the
 * avatar with a short hint ("小红举手了。先想一下：…") so the fixture
 * snapshot exercises the teacher speech-bubble visual.
 */

import { TeacherAvatar } from './teacher-avatar';
import styles from './classroom-front.module.css';

/** B.1.2 — accept an optional `bubbleContent` prop so the `/classroom-demo`
 *  route can swap in dynamic speech text while the B.1 fixture / snapshot
 *  route keeps the hardcoded fallback unchanged. */
export interface TeacherStageProps {
  bubbleContent?: string;
}

export function TeacherStage({ bubbleContent }: TeacherStageProps = {}) {
  const content =
    bubbleContent ?? '小红举手了。先想一下：1/2 + 1/3 的公分母是几？';
  return (
    <div className={styles.teacherStage} data-testid="teacher-stage">
      <div className={styles.podium}>讲台</div>
      <TeacherAvatar name="小诺姐姐" speaking />
      <div className={styles.teacherBubble} data-testid="teacher-bubble">
        {content}
      </div>
    </div>
  );
}
