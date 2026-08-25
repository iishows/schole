'use client';
import { useEffect, useRef } from 'react';
import { useStageStore } from '@/lib/store/stage';
import { ClassroomLayoutService } from '@/lib/services/classroom-layout-service';
import { bezierPoint } from '@/lib/utils/bezier-flight';
import { isClassroomShellEnabled } from '@/lib/config/feature-flags';

const SEAT_POSITIONS: Record<string, { x: number; y: number }> = {
  A1: { x: 80, y: 500 }, A2: { x: 200, y: 500 }, A3: { x: 320, y: 500 },
  B1: { x: 80, y: 380 }, B2: { x: 200, y: 380 }, B3: { x: 320, y: 380 },
  C1: { x: 80, y: 260 }, C2: { x: 200, y: 260 }, C3: { x: 320, y: 260 },
};

export function PassNoteOverlay() {
  const enabled = isClassroomShellEnabled();
  const note = useStageStore(s => (s.classroom as any).activeNote);
  const seatLayout = useStageStore(s => s.classroom.seatLayout);
  const dispatch = useStageStore(s => s.dispatchClassroomAction);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!enabled || !note) return;
    const from = ClassroomLayoutService.resolveSeat(seatLayout, note.from_seat);
    const to = ClassroomLayoutService.resolveSeat(seatLayout, note.to_seat);
    if (!from || !to) return;
    if (!from.deskmates.includes(to.agent_id)) {
      console.warn(`pass_note rejected: ${note.from_seat} → ${note.to_seat} not adjacent`);
      dispatch({
        type: 'pass_note', id: `n-bad-${Date.now()}`,
        from_seat: note.from_seat, to_seat: note.to_seat,
        content: note.content, animation: 'fly',
        agent_id: from.agent_id, timestamp: Date.now(),
      });
      // Clear activeNote so the SVG render guard drops the rejected paper.
      // The reducer leaves `pass_note` as a no-op, so we update the slice
      // directly here to make the rejection visible to the render branch.
      useStageStore.setState((s) => ({
        ...s,
        classroom: { ...s.classroom, activeNote: null },
      }));
      return;
    }
    // Animate 0→1 over 800ms
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / 800);
      const p0 = SEAT_POSITIONS[note.from_seat] ?? { x: 100, y: 100 };
      const p2 = SEAT_POSITIONS[note.to_seat] ?? { x: 300, y: 100 };
      const p1 = { x: (p0.x + p2.x) / 2, y: Math.min(p0.y, p2.y) - 80 };
      const pt = bezierPoint(p0, p1, p2, t);
      const note2 = svgRef.current?.querySelector('[data-testid="paper"]');
      if (note2 instanceof SVGElement) {
        note2.setAttribute('transform', `translate(${pt.x},${pt.y})`);
      }
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [enabled, note, seatLayout, dispatch]);

  if (!enabled || !note) return null;
  return (
    <svg
      ref={svgRef}
      className="pass-note-svg"
      data-testid="pass-note-svg"
      viewBox="0 0 400 600"
    >
      <g data-testid="paper">
        <rect x={-15} y={-10} width={30} height={20} fill="#fff" stroke="#888" />
        <text x={0} y={3} fontSize={10} textAnchor="middle">{note.content.slice(0, 4)}</text>
      </g>
    </svg>
  );
}
