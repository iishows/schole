'use client';

/**
 * Single student desk — bubble + avatar + name + table.
 *
 * B.1 wires the avatar text to `agent_id` directly because the V1.1
 * agent registry is not yet plumbed into the front view (that arrives in
 * B.3 when whisper-line / hand-raise pick up agent names). The shape is
 * still agent-name-shaped so swapping the source is one line.
 */

import type { SeatConfig } from '@/lib/store/classroom-state';
import { DeskBubble } from './desk-bubble';
import { StudentAvatar } from './student-avatar';
import { getStudentColor } from './class-helpers';
import styles from './classroom-front.module.css';

export interface DeskProps {
  seat: SeatConfig;
  seatIndex: number;
}

export function Desk({ seat, seatIndex }: DeskProps) {
  const colorClass = getStudentColor(seatIndex);
  // B.1 placeholder: agent registry is not yet wired to the front view, so
  // the agent_id is displayed as the visible label. Real names land in B.3.
  const displayName = seat.agent_id;
  return (
    <div
      className={styles.desk}
      data-testid={`desk-${seat.seat_id}`}
      tabIndex={0}
      role="button"
      aria-label={`Seat ${seat.seat_id}: ${displayName}`}
    >
      <DeskBubble name={displayName} colorClass={colorClass} />
      <StudentAvatar name={displayName} agentId={seat.agent_id} colorClass={colorClass} />
      <div className={styles.studentName}>{displayName}</div>
      <div className={styles.deskTable} />
    </div>
  );
}
