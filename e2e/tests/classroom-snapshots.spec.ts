/**
 * M4 visual snapshot baselines for Classroom Mode UI components.
 *
 * NOTE: Baselines must be generated with `pnpm dev` running on :3002
 * (the port the playwright webServer is configured to use — see
 * playwright.config.ts). Run:
 *
 *   1. Generate baselines (first run writes PNGs to
 *      `e2e/tests/__snapshots__/classroom-snapshots.spec.ts-snapshots/`):
 *        npx playwright test e2e/tests/classroom-snapshots.spec.ts --update-snapshots
 *      (Playwright will boot its own dev server on :3002 with
 *      `NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED=true` if none is running.)
 *
 *   2. Subsequent runs (CI / regression gate) fail if the rendered pixels drift
 *      from the committed baselines:
 *        npx playwright test e2e/tests/classroom-snapshots.spec.ts
 *
 * What the baselines cover:
 *   - PeriodBar       × 4 — before-class / lesson / break / after-class
 *   - CallOnCard      × 3 — idle (no call_on) / counting / expired (0ms)
 *   - BlackboardChalk × 2 — off (mode=false) / on-with-toast (mode=true)
 *
 * Strategy:
 *   Each test navigates to the standalone fixture route
 *   `/classroom-snapshot-fixture` (which mounts ONLY the three shell
 *   components — no full classroom load / async scene generation),
 *   waits for the fixture to render, seeds the zustand store via
 *   `window.__stageStore.setState({ classroom: { ... } })`, and asserts with
 *   `toHaveScreenshot()`.
 *
 *   The feature flag MUST be enabled at build/dev time. The shell components
 *   render `null` when `isClassroomShellEnabled()` returns false, so a
 *   server started without `NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED=true` will
 *   produce empty baselines.
 *
 * If the dev server is not available at the time of generation, the test
 * file can still be committed; `--list` will show the 9 discoverable tests,
 * but `--update-snapshots` will fail with a connection error.
 */

import { test, expect } from '../fixtures/base';

/** Build a complete ClassroomState payload for the snapshot under test. */
function buildClassroomState(
  partial: Partial<{
    period: 'before-class' | 'lesson' | 'break' | 'after-class';
    periodStartedAt: number | null;
    periodEndsAt: number | null;
    lessonLabel: string;
    handRaiseQueue: unknown[];
    activeCallOn: null | {
      target_agent_id: string;
      prompt: string;
      countdown_ms: number;
      called_at: number;
    };
    blackboardMode: boolean;
    seatLayout: unknown[];
    bellQueue: unknown[];
    lastError: string | null;
    activeNote: null;
    chalkStrokes: Array<{ path: Array<{ x: number; y: number }>; color?: string; width?: number }>;
    lastInputChannel: 'text' | 'voice' | 'raise_hand' | null;
  }>,
) {
  return {
    period: partial.period ?? 'before-class',
    periodStartedAt: partial.periodStartedAt ?? null,
    periodEndsAt: partial.periodEndsAt ?? null,
    lessonLabel: partial.lessonLabel ?? '',
    handRaiseQueue: partial.handRaiseQueue ?? [],
    activeCallOn: partial.activeCallOn ?? null,
    blackboardMode: partial.blackboardMode ?? false,
    seatLayout: partial.seatLayout ?? [],
    bellQueue: partial.bellQueue ?? [],
    lastError: partial.lastError ?? null,
    activeNote: partial.activeNote ?? null,
    chalkStrokes: partial.chalkStrokes ?? [],
    lastInputChannel: partial.lastInputChannel ?? null,
  };
}

/**
 * Navigate to the fixture route and seed the classroom store with the given
 * payload before the components mount. The `__stageStore` global is exposed
 * in dev builds by `lib/store/stage.ts`; if the global is not available (e.g.
 * a production build accidentally picked up this spec), this call will
 * throw with an actionable message rather than silently producing empty
 * snapshots.
 */
async function seedAndGoto(
  page: import('@playwright/test').Page,
  classroomState: ReturnType<typeof buildClassroomState>,
) {
  // Ensure the shell flag is on for this navigation (no-op if dev server was
  // started with the env var; belt-and-suspenders for localStorage-based
  // flag checks if any are added later).
  await page.addInitScript(() => {
    window.localStorage.setItem('NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED', 'true');
  });
  await page.goto('/classroom-snapshot-fixture');
  // Wait for the fixture root to mount BEFORE mutating the store — seeding
  // before React has subscribed would render the seeded state correctly,
  // but waiting for the testid guarantees the fixture's hydration + style
  // application has run, so the baselines lock in real rendered pixels
  // (not a transient pre-hydration frame).
  await page.waitForLoadState('domcontentloaded');
  await page.getByTestId('snapshot-fixture').waitFor({ state: 'attached' });
  await page.evaluate((state) => {
    const store = (window as unknown as { __stageStore?: { setState: (s: object) => void } })
      .__stageStore;
    if (!store || typeof store.setState !== 'function') {
      throw new Error(
        '__stageStore global is not exposed on window — see classroom-snapshots.spec.ts header note.',
      );
    }
    store.setState({ classroom: state });
  }, classroomState);
  // Let the seeded state propagate + initial motion / opacity transitions
  // settle before the assertion. ProactiveCard's call-on variant uses
  // `motion.div` with an `initial → animate` entrance (scale 0.95 → 1,
  // opacity 0 → 1, y 10 → 0); playwright's CSS-only animation disable does
  // not catch this JS-driven animation, so without the wait the assertion
  // races the entrance and the pixel diff never converges.
  await page.waitForTimeout(600);
}

test.describe('M4 visual snapshot baselines (Classroom Mode UI)', () => {
  test.describe('PeriodBar', () => {
    test('before-class — renders nothing', async ({ page }) => {
      await seedAndGoto(
        page,
        buildClassroomState({ period: 'before-class', lessonLabel: '' }),
      );
      // PeriodBar returns null in before-class / after-class — the testid
      // is therefore absent from the DOM. `toHaveCount(0)` asserts that.
      await expect(page.getByTestId('period-bar')).toHaveCount(0);
      // Capture the page chrome for visual context (still informative even
      // when the bar is absent — locks in the empty-bar layout).
      await expect(page).toHaveScreenshot('period-bar--before-class.png');
    });

    test('lesson — bell + label + countdown', async ({ page }) => {
      const now = Date.now();
      await seedAndGoto(
        page,
        buildClassroomState({
          period: 'lesson',
          periodStartedAt: now,
          // 25 minutes remaining — produces a stable "24:60" countdown that
          // ticks once per second; we freeze the page state by setting a
          // deterministic offset from `now`.
          periodEndsAt: now + 25 * 60 * 1000,
          lessonLabel: 'Lesson-1 数学 · 二次函数',
        }),
      );
      await expect(page.getByTestId('period-bar')).toBeVisible();
      await expect(page.getByTestId('period-bar')).toHaveClass(/lesson/);
      await expect(page).toHaveScreenshot('period-bar--lesson.png');
    });

    test('break — amber bar with bell', async ({ page }) => {
      await seedAndGoto(
        page,
        buildClassroomState({ period: 'break', lessonLabel: '' }),
      );
      await expect(page.getByTestId('period-bar')).toBeVisible();
      await expect(page.getByTestId('period-bar')).toHaveClass(/break/);
      await expect(page).toHaveScreenshot('period-bar--break.png');
    });

    test('after-class — renders nothing', async ({ page }) => {
      await seedAndGoto(
        page,
        buildClassroomState({ period: 'after-class', lessonLabel: '' }),
      );
      await expect(page.getByTestId('period-bar')).toHaveCount(0);
      await expect(page).toHaveScreenshot('period-bar--after-class.png');
    });
  });

  test.describe('CallOnCard', () => {
    test('idle — no active call_on', async ({ page }) => {
      await seedAndGoto(
        page,
        buildClassroomState({
          period: 'lesson',
          lessonLabel: 'Lesson-1 数学',
          periodStartedAt: Date.now(),
          periodEndsAt: Date.now() + 25 * 60 * 1000,
        }),
      );
      // CallOnCard returns null when there is no `activeCallOn`; the
      // inner `call-on-target` testid is therefore absent from the DOM.
      await expect(page.getByTestId('call-on-target')).toHaveCount(0);
      await expect(page).toHaveScreenshot('call-on-card--idle.png');
    });

    test('counting — active call_on with 4s countdown', async ({ page }) => {
      const calledAt = Date.now();
      await seedAndGoto(
        page,
        buildClassroomState({
          period: 'lesson',
          lessonLabel: 'Lesson-1 数学',
          periodStartedAt: calledAt,
          periodEndsAt: calledAt + 25 * 60 * 1000,
          activeCallOn: {
            target_agent_id: 'student-1',
            prompt: '请解释二次函数顶点式的几何意义',
            countdown_ms: 4000,
            called_at: calledAt,
          },
        }),
      );
      // ProactiveCard's call-on variant puts `data-testid="call-on-target"`
      // on the inner target line ("→ student-1"). CallOnCard's
      // `data-testid="call-on-card"` prop is currently dropped by
      // ProactiveCard's prop surface (out of scope for this commit — V1.1
      // classroom shell components are frozen); the inner testid is the
      // ground truth for "card visible".
      await expect(page.getByTestId('call-on-target')).toBeVisible();
      await expect(page.getByTestId('call-on-target')).toContainText('student-1');
      await expect(page).toHaveScreenshot('call-on-card--counting.png');
    });

    test('expired — countdown_ms: 0 (timer fired, cue_user dispatched)', async ({ page }) => {
      const calledAt = Date.now();
      await seedAndGoto(
        page,
        buildClassroomState({
          period: 'lesson',
          lessonLabel: 'Lesson-1 数学',
          periodStartedAt: calledAt,
          periodEndsAt: calledAt + 25 * 60 * 1000,
          activeCallOn: {
            target_agent_id: 'student-1',
            prompt: '请解释二次函数顶点式的几何意义',
            countdown_ms: 0,
            called_at: calledAt,
          },
        }),
      );
      // Component still renders while activeCallOn is non-null — the
      // expired state is reflected in the countdown label "0s" rather than
      // disappearing. This snapshot locks in the visual cue for the M1
      // cue_user fallback boundary.
      await expect(page.getByTestId('call-on-target')).toBeVisible();
      await expect(page).toHaveScreenshot('call-on-card--expired.png');
    });
  });

  test.describe('BlackboardChalk', () => {
    test('off — mode=false, no chalk svg, no toast', async ({ page }) => {
      await seedAndGoto(
        page,
        buildClassroomState({
          period: 'lesson',
          lessonLabel: 'Lesson-1 数学',
          periodStartedAt: Date.now(),
          periodEndsAt: Date.now() + 25 * 60 * 1000,
          blackboardMode: false,
          chalkStrokes: [],
        }),
      );
      await expect(page.getByTestId('blackboard-chalk-svg')).toHaveCount(0);
      await expect(page.getByTestId('blackboard-auto-open-toast')).toHaveCount(0);
      await expect(page).toHaveScreenshot('blackboard-chalk--off.png');
    });

    test('on-with-toast — mode=true with chalk strokes + auto-open toast', async ({ page }) => {
      // A pair of strokes is enough to exercise buildChalkSvg without
      // dominating the snapshot; deterministic coords keep the baseline
      // reproducible across runs.
      const strokes = [
        { path: [{ x: 100, y: 100 }, { x: 200, y: 150 }, { x: 300, y: 200 }], width: 4 },
        { path: [{ x: 150, y: 250 }, { x: 250, y: 300 }], width: 4 },
      ];
      await seedAndGoto(
        page,
        buildClassroomState({
          period: 'lesson',
          lessonLabel: 'Lesson-1 数学',
          periodStartedAt: Date.now(),
          periodEndsAt: Date.now() + 25 * 60 * 1000,
          blackboardMode: true,
          chalkStrokes: strokes,
        }),
      );
      await expect(page.getByTestId('blackboard-chalk-svg')).toBeVisible();
      await expect(page.getByTestId('blackboard-auto-open-toast')).toBeVisible();
      await expect(page.getByTestId('blackboard-auto-open-toast')).toContainText('黑板已开启');
      await expect(page).toHaveScreenshot('blackboard-chalk--on-with-toast.png');
    });
  });
});
