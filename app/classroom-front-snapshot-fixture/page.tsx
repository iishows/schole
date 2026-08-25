'use client';

/**
 * B.1 snapshot fixture route — renders ONLY the `<ClassroomFront />`
 * component (no PeriodBar / CallOnCard / BlackboardChalkLayer mix-ins
 * from V1.1). Used by `e2e/tests/classroom-front-snapshots.spec.ts` to
 * lock in visual baselines for the new front-view layout.
 *
 * Strategy mirrors the V1.1 `app/classroom-snapshot-fixture/page.tsx`
 * M4 fixture, but is a SEPARATE route + spec so the baseline directory
 * stays clean (`classroom-front-snapshots.spec.ts-snapshots/`); V1.1's
 * `classroom-snapshots.spec.ts-snapshots/` baselines are NOT touched.
 *
 * The fixture is gated on `isClassroomFrontEnabled()`; if the dev server
 * was started without `NEXT_PUBLIC_CLASSROOM_FRONT_ENABLED=true`,
 * `<ClassroomFront />` returns `null` and the baseline would be a blank
 * canvas. The spec seeds the env via `localStorage.setItem` for
 * belt-and-suspenders, matching the V1.1 fixture pattern.
 *
 * Layout: fixed 1280×800 viewport so the baselines are deterministic
 * across runs.
 */

import { ClassroomFront } from '@/components/classroom-shell/front';
import { isClassroomFrontEnabled } from '@/lib/config/feature-flags';

export default function ClassroomFrontSnapshotFixturePage() {
  const enabled = isClassroomFrontEnabled();
  if (!enabled) {
    return (
      <div
        data-testid="front-snapshot-fixture"
        data-front-disabled="true"
        style={{
          width: 1280,
          minHeight: 800,
          padding: 24,
          color: '#999',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        front-view flag is OFF — start the dev server with
        NEXT_PUBLIC_CLASSROOM_FRONT_ENABLED=true to render baselines.
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
