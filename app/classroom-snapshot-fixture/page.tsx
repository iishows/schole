'use client';

/**
 * Snapshot fixture route — renders the three classroom-shell components
 * (PeriodBar / CallOnCard / BlackboardChalkLayer) standalone, with NO
 * classroom load or scene generation involved. Used exclusively by the
 * M4 visual snapshot suite
 * (`e2e/tests/classroom-snapshots.spec.ts`):
 *
 *   await page.goto('/classroom-snapshot-fixture')
 *   window.__stageStore.setState({ classroom: <seed> })
 *   await expect(page).toHaveScreenshot(...)
 *
 * The fixtures are seeded via `window.__stageStore` (exposed in dev builds
 * by `lib/store/stage.ts`). The component tree is laid out in a fixed
 * viewport (1280x800) so the baselines are deterministic across runs —
 * PeriodBar across the top, CallOnCard centred, BlackboardChalkLayer
 * filling the rest.
 *
 * Route name note: the original V1.1 plan called this
 * `app/__classroom-snapshot-fixture__/page.tsx`, but Next.js 13+ app
 * router treats folders starting with `_` as private (excluded from
 * routing), so the URL would 404. The dashed name lives outside that
 * convention and is routable.
 *
 * The route is gated on `isClassroomShellEnabled()`: if the dev server was
 * NOT started with `NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED=true`, every
 * component returns `null` and the fixture renders an empty container —
 * the test suite relies on the flag being on at build/dev time.
 */

import { PeriodBar } from '@/components/classroom-shell/period-bar';
import { CallOnCard } from '@/components/classroom-shell/call-on-card';
import { BlackboardChalkLayer } from '@/components/classroom-shell/blackboard-chalk-layer';
import { isClassroomShellEnabled } from '@/lib/config/feature-flags';

export default function ClassroomSnapshotFixturePage() {
  const enabled = isClassroomShellEnabled();
  if (!enabled) {
    return (
      <div
        data-testid="snapshot-fixture"
        data-shell-disabled="true"
        style={{
          width: 1280,
          minHeight: 800,
          padding: 24,
          color: '#999',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        classroom shell flag is OFF — start the dev server with
        NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED=true to render baselines.
      </div>
    );
  }
  return (
    <div
      data-testid="snapshot-fixture"
      style={{
        position: 'relative',
        width: 1280,
        minHeight: 800,
        background: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <PeriodBar />
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 24,
          right: 24,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <CallOnCard />
      </div>
      <BlackboardChalkLayer />
    </div>
  );
}
