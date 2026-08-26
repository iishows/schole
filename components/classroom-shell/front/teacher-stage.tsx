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
 *
 * B.1.6 — `compact` mode. When `compact === true` the stage shrinks
 * to a horizontal row: a tiny podium + the 36×36 thumbnail avatar +
 * the teacher name + 🎤 mic badge. No teacher bubble, no large
 * layout. Used by the "classroom" view (🏫 教室) so the desks + bubbles
 * get the whole main area while the teacher is still glanceable in
 * the top-right corner.
 */

import { TeacherAvatar } from './teacher-avatar';
import styles from './classroom-front.module.css';

/** B.1.2 — accept an optional `bubbleContent` prop so the `/classroom-demo`
 *  route can swap in dynamic speech text while the B.1 fixture / snapshot
 *  route keeps the hardcoded fallback unchanged. */
export interface TeacherStageProps {
  bubbleContent?: string;
  /** B.1.6 — when true, render the thumbnail variant (no bubble,
   *  compact avatar). Defaults to `false`. */
  compact?: boolean;
}

export function TeacherStage({
  bubbleContent,
  compact = false,
}: TeacherStageProps = {}) {
  const content =
    bubbleContent ?? '小红举手了。先想一下：1/2 + 1/3 的公分母是几？';
  const containerClass = compact ? styles.teacherStageCompact : styles.teacherStage;
  return (
    <div
      className={containerClass}
      data-testid="teacher-stage"
      data-compact={compact ? 'true' : 'false'}
    >
      <div className={styles.podiumCompact} data-testid="teacher-podium">
        讲台
      </div>
      <TeacherAvatar name="小诺姐姐" speaking={!compact} compact={compact} />
      {compact ? (
        <span className={styles.teacherThumbnailName} data-testid="teacher-thumbnail-name">
          小诺姐姐
        </span>
      ) : null}
      {compact ? null : (
        <div className={styles.teacherBubble} data-testid="teacher-bubble">
          {content}
        </div>
      )}
    </div>
  );
}
