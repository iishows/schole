'use client';

/**
 * Single student desk — bubble + avatar + name + table.
 *
 * B.1 wires the avatar text to `agent_id` directly because the V1.1
 * agent registry is not yet plumbed into the front view (that arrives in
 * B.3 when whisper-line / hand-raise pick up agent names). The shape is
 * still agent-name-shaped so swapping the source is one line.
 *
 * B.1.1 adds two props:
 *  - `bubbleContent` — forwarded to `<DeskBubble />` so the snapshot
 *    fixture can mock the four coloured speech bubbles (pink/green/amber/
 *    blue) the mockup shows above each desk.
 *  - `speaking` — applies the `.speaking` class on the avatar so the
 *    front of the hand-raise queue gets the speaking-pulse animation.
 */

import type { SeatConfig } from '@/lib/store/classroom-state';
import { DeskBubble } from './desk-bubble';
import { StudentAvatar } from './student-avatar';
import { getBubbleColorForSeat, getStudentColor } from './class-helpers';
import styles from './classroom-front.module.css';

export interface DeskProps {
  seat: SeatConfig;
  seatIndex: number;
  bubbleContent?: string;
  bubbleThinking?: boolean;
  speaking?: boolean;
  /** B.1.2 — optional override for the seat's color class. When
   *  omitted, the seat index drives the colour (existing B.1.1
   *  behaviour). */
  colorClass?: string;
  /** B.1.2 — hand-raise flag. Marks the avatar with `.hand` so the
   *  wave animation fires. */
  hand?: boolean;
  /** B.1.2 — display name override so the demo route can show the
   *  Chinese name from its pools instead of the agent id. */
  displayName?: string;
}

export function Desk({
  seat,
  seatIndex,
  bubbleContent,
  bubbleThinking,
  speaking,
  colorClass,
  hand,
  displayName,
}: DeskProps) {
  const resolvedColorClass = colorClass ?? getStudentColor(seatIndex);
  const bubbleColor = getBubbleColorForSeat(resolvedColorClass);
  // B.1 placeholder: agent registry is not yet wired to the front view, so
  // the agent_id is displayed as the visible label. Real names land in B.3.
  const resolvedDisplayName = displayName ?? seat.agent_id;
  return (
    <div
      className={styles.desk}
      data-testid={`desk-${seat.seat_id}`}
      tabIndex={0}
      role="button"
      aria-label={`Seat ${seat.seat_id}: ${resolvedDisplayName}`}
    >
      <DeskBubble
        name={resolvedDisplayName}
        colorClass={bubbleColor}
        content={bubbleContent}
        thinking={bubbleThinking}
      />
      <StudentAvatar
        name={resolvedDisplayName}
        agentId={seat.agent_id}
        colorClass={resolvedColorClass}
        speaking={speaking}
        hand={hand}
      />
      <div className={styles.studentName}>{resolvedDisplayName}</div>
      <div className={styles.deskTable} />
    </div>
  );
}
