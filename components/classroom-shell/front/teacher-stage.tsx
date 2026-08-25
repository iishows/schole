'use client';

/**
 * Teacher stage — podium + teacher avatar. The teacher avatar name
 * ("小诺姐姐") is hardcoded for B.1 — V1.1's agent registry does not yet
 * surface a teacher agent id, so a constant name keeps the visual mockup-
 * faithful without adding state fields.
 */

import { TeacherAvatar } from './teacher-avatar';
import styles from './classroom-front.module.css';

export function TeacherStage() {
  return (
    <div className={styles.teacherStage} data-testid="teacher-stage">
      <div className={styles.podium}>讲台</div>
      <TeacherAvatar name="小诺姐姐" />
    </div>
  );
}
