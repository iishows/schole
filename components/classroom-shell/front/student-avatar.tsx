'use client';

/**
 * Student avatar — 50×50 circle with the seat's colour class applied
 * (student1/2/3/me — cycles by seatIndex, see `getStudentColor`). The
 * rendered glyph is the agent name's first character (or agent id's
 * first char when the name is empty), which keeps the avatar stable
 * even before the agent registry is wired through.
 */

import { getAvatarFallback } from './class-helpers';
import styles from './classroom-front.module.css';

export interface StudentAvatarProps {
  name: string;
  agentId?: string;
  colorClass: string;
}

export function StudentAvatar({ name, agentId = '', colorClass }: StudentAvatarProps) {
  const fallback = getAvatarFallback(name, agentId);
  return (
    <div
      className={`${styles.studentAvatar} ${styles[colorClass]}`}
      data-testid={`student-avatar-${agentId || name}`}
      data-color={colorClass}
    >
      {fallback}
    </div>
  );
}
