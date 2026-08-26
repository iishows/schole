'use client';

/**
 * Teacher avatar — circular avatar with 🎤 corner badge and an
 * optional `speaking` pulse modifier. B.1 ships the avatar static
 * (speaking is wired by the B.2 call-on card); the prop is already in
 * place so B.2 only needs to thread `activeCallOn`-derived state.
 *
 * B.1.6 — `compact` mode. When `compact === true` the avatar shrinks
 * to a 36×36 thumbnail (was 60×60 in the full-size layout) and the
 * name plate disappears (the thumbnail sits next to a separate name
 * label rendered by `<TeacherStage compact />`). Used by the
 * "classroom" view (🏫 教室) where the teacher stage is rendered as
 * a small "see who's teaching at a glance" indicator rather than a
 * full teaching presence.
 */

import styles from './classroom-front.module.css';

export interface TeacherAvatarProps {
  name: string;
  speaking?: boolean;
  /** B.1.6 — when true, render the 36×36 thumbnail variant (no
   *  name plate). Defaults to `false`. */
  compact?: boolean;
}

export function TeacherAvatar({
  name,
  speaking = false,
  compact = false,
}: TeacherAvatarProps) {
  const baseClass = compact ? styles.teacherAvatarCompact : styles.teacherAvatar;
  return (
    <div
      className={baseClass}
      data-testid="teacher-avatar"
      data-speaking={speaking ? 'true' : 'false'}
      data-compact={compact ? 'true' : 'false'}
    >
      <span aria-hidden="true">👩‍🏫</span>
      {compact ? null : <span className={styles.teacherAvatarName}>{name}</span>}
    </div>
  );
}
