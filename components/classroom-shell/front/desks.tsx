'use client';

/**
 * Desks grid — 4-column CSS grid container, one `<Desk />` per entry in
 * `classroom.seatLayout`. Returns `null` when the seat layout is empty so
 * the visual mockup degrades to just the blackboard + teacher stage
 * during the L0 "no agents generated yet" boot window.
 */

import { useStageStore } from '@/lib/store/stage';
import { Desk } from './desk';
import styles from './classroom-front.module.css';

export function Desks() {
  const seatLayout = useStageStore((s) => s.classroom.seatLayout);
  if (!seatLayout || seatLayout.length === 0) return null;
  return (
    <div className={styles.desks} data-testid="front-desks">
      {seatLayout.map((seat, idx) => (
        <Desk key={seat.seat_id} seat={seat} seatIndex={idx} />
      ))}
    </div>
  );
}
