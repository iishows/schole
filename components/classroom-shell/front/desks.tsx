'use client';

/**
 * Desks grid — 4-column CSS grid container, one `<Desk />` per entry in
 * `classroom.seatLayout`. Returns `null` when the seat layout is empty so
 * the visual mockup degrades to just the blackboard + teacher stage
 * during the L0 "no agents generated yet" boot window.
 *
 * B.1.1: the front of the hand-raise queue (`handRaiseQueue[0]`, sorted by
 * V1.1 L1 `resolveSortKey`) is treated as the active speaker — that seat's
 * avatar gets the `.speaking` class so the speaking-pulse animation
 * follows the queue's head. Mockup desk-bubble content is derived from a
 * small lookup keyed by agent id so the snapshot baselines exercise all
 * four colour variants (pink / green / amber / blue) without needing
 * production state.
 */

import { useStageStore } from '@/lib/store/stage';
import { Desk } from './desk';
import styles from './classroom-front.module.css';

/** B.1.1 — mock desk-bubble content per agent id (mockup-faithful). */
const MOCK_BUBBLE_CONTENT: Record<string, string> = {
  alice: '我觉得公分母是 6…',
  bob: '先通分再相加',
  carol: '我写在白板上 📝',
  dave: '我同意小红 ✓',
  eve: '👀 我在观察',
};

/** B.1.2 — props consumed by the dynamic `/classroom-demo` route.
 *  All fields are optional; when omitted the component falls back to
 *  the B.1 default mockup-faithful rendering. */
export interface DesksDemoProps {
  /** Per-agent bubble content override (display text). */
  deskBubbleContents?: Record<string, string>;
  /** Per-agent display-name override so the demo route can show
   *  Chinese names from its pools. */
  deskDisplayNames?: Record<string, string>;
  /** Per-agent hand-raise flag. Drives the avatar's `.hand` class. */
  deskHandRaised?: Record<string, boolean>;
  /** Agent id currently being called on (gets `.speaking` on top of
   *  `.hand` for full mockup fidelity). */
  activeCallOnAgentId?: string | null;
}

export function Desks(demo: DesksDemoProps = {}) {
  const seatLayout = useStageStore((s) => s.classroom.seatLayout);
  const handRaiseQueue = useStageStore((s) => s.classroom.handRaiseQueue);
  const activeSpeakerId =
    handRaiseQueue && handRaiseQueue.length > 0 ? handRaiseQueue[0]?.agent_id : null;
  if (!seatLayout || seatLayout.length === 0) return null;
  return (
    <div className={styles.desks} data-testid="front-desks">
      {seatLayout.map((seat, idx) => {
        const demoBubble = demo.deskBubbleContents?.[seat.agent_id];
        const bubbleContent =
          demoBubble !== undefined ? demoBubble : MOCK_BUBBLE_CONTENT[seat.agent_id];
        const isHandRaised =
          demo.deskHandRaised?.[seat.agent_id] ??
          Boolean(activeSpeakerId && seat.agent_id === activeSpeakerId);
        const isCallOn = demo.activeCallOnAgentId === seat.agent_id;
        const displayName = demo.deskDisplayNames?.[seat.agent_id];
        return (
          <Desk
            key={seat.seat_id}
            seat={seat}
            seatIndex={idx}
            bubbleContent={bubbleContent}
            bubbleThinking={bubbleContent === undefined}
            speaking={isCallOn || (isHandRaised && seat.agent_id === activeSpeakerId)}
            hand={isHandRaised}
            displayName={displayName}
          />
        );
      })}
    </div>
  );
}
