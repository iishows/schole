'use client';

/**
 * Student avatar — 50×50 circle with the seat's colour class applied
 * (student1/2/3/me — cycles by seatIndex, see `getStudentColor`). The
 * rendered glyph is the agent's emoji when `agentId` matches the
 * `getEmojiForAgent` lookup (mockup-faithful — B.1.1), otherwise the
 * agent name's first character (or agent id's first char when the name
 * is empty), which keeps the avatar stable even before the agent
 * registry is wired through.
 */

import { getEmojiForAgent } from './class-helpers';
import styles from './classroom-front.module.css';

export interface StudentAvatarProps {
  name: string;
  agentId?: string;
  colorClass: string;
  speaking?: boolean;
  /** B.1.2 — mark a seat as raising a hand; toggles the `.hand` class
   *  on the avatar so the wave animation fires (mockup-faithful). */
  hand?: boolean;
}

export function StudentAvatar({
  name,
  agentId = '',
  colorClass,
  speaking = false,
  hand = false,
}: StudentAvatarProps) {
  const glyph = getEmojiForAgent(name, agentId);
  const className = [
    styles.studentAvatar,
    styles[colorClass],
    speaking ? styles.speaking : '',
    hand ? styles.hand : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={className}
      data-testid={`student-avatar-${agentId || name}`}
      data-color={colorClass}
      data-speaking={speaking ? 'true' : 'false'}
      data-hand={hand ? 'true' : 'false'}
    >
      {glyph}
    </div>
  );
}
