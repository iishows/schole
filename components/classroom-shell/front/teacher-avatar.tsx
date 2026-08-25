'use client';

/**
 * Teacher avatar — 60×60 circular avatar with 🎤 corner badge and an
 * optional `speaking` pulse modifier. B.1 ships the avatar static
 * (speaking is wired by the B.2 call-on card); the prop is already in
 * place so B.2 only needs to thread `activeCallOn`-derived state.
 */

import styles from './classroom-front.module.css';

export interface TeacherAvatarProps {
  name: string;
  speaking?: boolean;
}

export function TeacherAvatar({ name, speaking = false }: TeacherAvatarProps) {
  return (
    <div
      className={styles.teacherAvatar}
      data-testid="teacher-avatar"
      data-speaking={speaking ? 'true' : 'false'}
    >
      <span aria-hidden="true">👩‍🏫</span>
      <span className={styles.teacherAvatarName}>{name}</span>
    </div>
  );
}
