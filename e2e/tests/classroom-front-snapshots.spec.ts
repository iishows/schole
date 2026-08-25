/**
 * B.1 visual snapshot baselines for the front-view classroom.
 *
 * Baselines live in
 * `e2e/tests/classroom-front-snapshots.spec.ts-snapshots/` (NEW directory;
 * V1.1's `classroom-snapshots.spec.ts-snapshots/` baselines are NOT
 * touched).
 *
 * Run:
 *   1. Generate baselines (first run writes PNGs):
 *        npx playwright test e2e/tests/classroom-front-snapshots.spec.ts --update-snapshots
 *      Playwright will boot its own dev server on :3002 with the
 *      classroom-shell + classroom-front flags on (see
 *      playwright.config.ts); the fixture page is gated on
 *      `isClassroomFrontEnabled()` so the flag MUST be enabled.
 *
 *   2. Subsequent runs (CI / regression gate) fail if the rendered pixels
 *      drift from the committed baselines:
 *        npx playwright test e2e/tests/classroom-front-snapshots.spec.ts
 *
 * What the baselines cover:
 *   - empty classroom (no seatLayout) — blackboard + teacher stage only
 *   - 5 desks with avatars — full layout lock-in for the 4-column grid
 *   - active note — whisper-line path overlay between two desks
 *
 * Strategy:
 *   Each test navigates to the standalone fixture route
 *   `/classroom-front-snapshot-fixture` (which mounts ONLY
 *   `<ClassroomFront />` — no full classroom load / async scene
 *   generation), waits for the fixture to render, seeds the zustand
 *   store via `window.__stageStore.setState({ classroom: <seed> })`,
 *   and asserts with `toHaveScreenshot()`.
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
    activeCallOn: null | Record<string, unknown>;
    blackboardMode: boolean;
    seatLayout: Array<{ seat_id: string; agent_id: string; deskmates: string[]; zone: 'front' | 'middle' | 'back' }>;
    bellQueue: unknown[];
    lastError: string | null;
    activeNote: { from_seat: string; to_seat: string; content: string; animation: 'fly' } | null;
    chalkStrokes: Array<{ path: Array<{ x: number; y: number }>; color?: string; width?: number }>;
    lastInputChannel: 'text' | 'voice' | 'raise_hand' | null;
  }>,
) {
  return {
    period: partial.period ?? 'lesson',
    periodStartedAt: partial.periodStartedAt ?? null,
    periodEndsAt: partial.periodEndsAt ?? null,
    lessonLabel: partial.lessonLabel ?? '',
    handRaiseQueue: partial.handRaiseQueue ?? [],
    activeCallOn: partial.activeCallOn ?? null,
    blackboardMode: partial.blackboardMode ?? true,
    seatLayout: partial.seatLayout ?? [],
    bellQueue: partial.bellQueue ?? [],
    lastError: partial.lastError ?? null,
    activeNote: partial.activeNote ?? null,
    chalkStrokes: partial.chalkStrokes ?? [],
    lastInputChannel: partial.lastInputChannel ?? null,
  };
}

/**
 * Navigate to the B.1 fixture route and seed the classroom store. The
 * `__stageStore` global is exposed in dev builds by `lib/store/stage.ts`.
 */
async function seedAndGoto(
  page: import('@playwright/test').Page,
  classroomState: ReturnType<typeof buildClassroomState>,
) {
  await page.addInitScript(() => {
    // Belt-and-suspenders so the flag is on even if the dev server was
    // started without the env var. Mirrors the V1.1 snapshot spec.
    window.localStorage.setItem('NEXT_PUBLIC_CLASSROOM_FRONT_ENABLED', 'true');
  });
  await page.goto('/classroom-front-snapshot-fixture');
  await page.waitForLoadState('domcontentloaded');
  await page.getByTestId('front-snapshot-fixture').waitFor({ state: 'attached' });
  await page.evaluate((state) => {
    const store = (window as unknown as { __stageStore?: { setState: (s: object) => void } })
      .__stageStore;
    if (!store || typeof store.setState !== 'function') {
      throw new Error(
        '__stageStore global is not exposed on window — see classroom-front-snapshots.spec.ts header note.',
      );
    }
    store.setState({ classroom: state });
  }, classroomState);
  // Let the seeded state propagate + CSS transitions settle before the
  // assertion. 1500ms matches the V1.1 snapshot spec's "let initial motion
  // / opacity transitions settle" budget plus a small buffer for the
  // Next.js dev-tools overlay (which lazy-mounts in dev mode and would
  // otherwise drift the baseline).
  await page.waitForTimeout(1500);
}

test.describe('B.1 visual snapshot baselines (Classroom Mode front view)', () => {
  test('empty classroom — no seatLayout (blackboard + teacher only)', async ({ page }) => {
    await seedAndGoto(
      page,
      buildClassroomState({
        period: 'lesson',
        lessonLabel: 'Lesson-1 数学 · 二次函数',
        periodStartedAt: Date.now(),
        periodEndsAt: Date.now() + 25 * 60 * 1000,
        seatLayout: [],
      }),
    );
    // The front-view container + blackboard + teacher stage should all be
    // present; the desks grid is hidden when seatLayout is empty.
    await expect(page.getByTestId('classroom-front')).toBeVisible();
    await expect(page.getByTestId('front-blackboard')).toBeVisible();
    await expect(page.getByTestId('teacher-stage')).toBeVisible();
    await expect(page.getByTestId('front-desks')).toHaveCount(0);
    await expect(page).toHaveScreenshot('front-empty.png');
  });

  test('5 desks — full layout, 4-column grid with avatars + desks + tables', async ({ page }) => {
    const seats = [
      { seat_id: 'A1', agent_id: 'alice', deskmates: [], zone: 'front' as const },
      { seat_id: 'A2', agent_id: 'bob', deskmates: [], zone: 'front' as const },
      { seat_id: 'A3', agent_id: 'carol', deskmates: [], zone: 'front' as const },
      { seat_id: 'A4', agent_id: 'dave', deskmates: [], zone: 'front' as const },
      { seat_id: 'B1', agent_id: 'eve', deskmates: [], zone: 'middle' as const },
    ];
    await seedAndGoto(
      page,
      buildClassroomState({
        period: 'lesson',
        lessonLabel: 'Lesson-3 数学 · 通分',
        periodStartedAt: Date.now(),
        periodEndsAt: Date.now() + 25 * 60 * 1000,
        seatLayout: seats,
      }),
    );
    await expect(page.getByTestId('front-desks')).toBeVisible();
    // Exactly 5 desks rendered (one per seatLayout entry).
    await expect(page.locator('[data-testid^="desk-"]')).toHaveCount(5);
    await expect(page).toHaveScreenshot('front-5-desks.png');
  });

  test('active note — whisper-line path overlays two deskmates', async ({ page }) => {
    const seats = [
      { seat_id: 'A1', agent_id: 'alice', deskmates: [], zone: 'front' as const },
      { seat_id: 'A2', agent_id: 'bob', deskmates: [], zone: 'front' as const },
      { seat_id: 'A3', agent_id: 'carol', deskmates: [], zone: 'front' as const },
      { seat_id: 'A4', agent_id: 'dave', deskmates: [], zone: 'front' as const },
    ];
    await seedAndGoto(
      page,
      buildClassroomState({
        period: 'lesson',
        lessonLabel: 'Lesson-5 数学 · 纸条',
        periodStartedAt: Date.now(),
        periodEndsAt: Date.now() + 25 * 60 * 1000,
        seatLayout: seats,
        activeNote: {
          from_seat: 'A1',
          to_seat: 'A2',
          content: 'alice → bob',
          animation: 'fly',
        },
      }),
    );
    // Whisper-line SVG mounts; the path child only renders when activeNote
    // is non-null.
    await expect(page.getByTestId('whisper-line')).toBeVisible();
    await expect(page.getByTestId('whisper-line-path')).toBeVisible();
    await expect(page).toHaveScreenshot('front-active-note.png');
  });
});
