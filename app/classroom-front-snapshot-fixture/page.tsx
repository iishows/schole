'use client';

/**
 * B.1 snapshot fixture route — renders ONLY the `<ClassroomFront />`
 * component with a pre-seeded mock store (period=lesson + 5 desks +
 * blackboardMode=true) so opening this URL in a browser immediately
 * shows the B.1 front-view visual without requiring store mutations.
 *
 * Used by `e2e/tests/classroom-front-snapshots.spec.ts` to lock in visual
 * baselines. The e2e spec ALSO seeds via `__stageStore.setState` —
 * redundant here but harmless (same payload).
 */

import { useEffect } from 'react';
import { ClassroomFront } from '@/components/classroom-shell/front';
import { isClassroomFrontEnabled } from '@/lib/config/feature-flags';
import { useStageStore } from '@/lib/store/stage';

const MOCK_SEAT_LAYOUT = [
  { seat_id: 'A1', agent_id: 'alice', deskmates: [], zone: 'front' as const },
  { seat_id: 'A2', agent_id: 'bob', deskmates: [], zone: 'front' as const },
  { seat_id: 'A3', agent_id: 'carol', deskmates: [], zone: 'front' as const },
  { seat_id: 'A4', agent_id: 'dave', deskmates: [], zone: 'middle' as const },
  { seat_id: 'B1', agent_id: 'eve', deskmates: [], zone: 'middle' as const },
];

export default function ClassroomFrontSnapshotFixturePage() {
  const enabled = isClassroomFrontEnabled();

  useEffect(() => {
    if (!enabled) return;
    useStageStore.setState({
      classroom: {
        period: 'lesson',
        periodStartedAt: Date.now(),
        periodEndsAt: Date.now() + 25 * 60 * 1000,
        lessonLabel: 'Lesson-3 数学 · 通分',
        blackboardMode: true,
        chalkStrokes: [],
        handRaiseQueue: [],
        activeCallOn: null,
        seatLayout: MOCK_SEAT_LAYOUT,
        bellQueue: [],
        lastError: null,
        activeNote: null,
        // B.1.1 — required by ClassroomState. Left at the default
        // (null) so the snapshot visual is byte-identical to the
        // baseline established before the field was added.
        lastInputChannel: null,
      },
    });
  }, [enabled]);

  if (!enabled) {
    return (
      <div
        data-testid="front-snapshot-fixture"
        data-front-disabled="true"
        style={{
          width: 1280, minHeight: 800, padding: 24, color: '#999',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        front-view flag is OFF — start dev server with NEXT_PUBLIC_CLASSROOM_FRONT_ENABLED=true.
      </div>
    );
  }
  return (
    <div
      data-testid="front-snapshot-fixture"
      style={{
        position: 'relative',
        width: 1280,
        minHeight: 800,
        background: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <ClassroomFront />
    </div>
  );
}
