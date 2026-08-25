// @vitest-environment jsdom
// Test environment note:
//   `@testing-library/react` is not a project dependency (see existing
//   `period-bar.test.tsx` for the createRoot+act deviation note), and the
//   spec says no new deps. Driven via `createRoot` + `act` instead of
//   `render()` + `toHaveStyle()`.
//
//   The component is a CSS-only responsive collapse (two divs toggled by
//   `@media (max-width: 640px)` in globals.css). jsdom does NOT process CSS
//   media queries, so the DOM contains BOTH `.period-bar-mobile` and
//   `.period-bar-full` regardless of `global.innerWidth`. The tests assert
//   that:
//     1. the outer wrapper carries the period modifier class so the palette
//        still applies (lesson/break/after-class),
//     2. the variant targeted at the active viewport (mobile 480px OR
//        desktop 1280px) is present in the DOM,
//     3. the other variant is also rendered (otherwise tall-bar + short-bar
//        would briefly flicker on hydration).
//   The actual height swap (36px vs 44px) is verified at runtime by
//   §M4 visual-snapshot baselines, not here.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { PeriodBar } from '../period-bar';
import { useStageStore } from '@/lib/store/stage';

// React's `act()` helper needs this global flag to silence the
// "not configured to support act(...)" warning under vitest.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Mock the Web Audio hook so the test never touches `window.AudioContext`.
vi.mock('@/lib/hooks/use-period-bar-bell', () => ({
  usePeriodBarBell: () => ({
    playBell: vi.fn(),
    playTransition: vi.fn(),
    playAttention: vi.fn(),
    playWrap: vi.fn(),
  }),
}));

describe('PeriodBar mobile responsive collapse (L4)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED = 'true';
    useStageStore.getState().resetClassroom?.();
    useStageStore.setState((s) => ({
      ...s,
      classroom: {
        ...s.classroom,
        period: 'lesson',
        periodStartedAt: Date.now() - 30_000,
        periodEndsAt: Date.now() + 30_000,
        lessonLabel: 'Lesson-1 异分母分数加法',
      },
    }));
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    // Reset innerWidth between tests so the next test starts from a clean
    // state regardless of order.
    global.innerWidth = 1024;
  });

  it('renders mobile 36px variant in DOM at viewport 480px (<= 640)', async () => {
    global.innerWidth = 480;
    await act(async () => {
      root.render(<PeriodBar />);
    });
    const wrapper = container.firstChild as HTMLElement | null;
    // Outer wrapper still carries the period modifier so the palette stays
    // consistent across breakpoints.
    expect(wrapper?.className ?? '').toMatch(/period-bar--lesson/);
    // The mobile-only subtree (36px mini bar) must be in the DOM at this
    // viewport. jsdom will not toggle its `display: flex` on, but the CSS
    // media query in globals.css will in the real browser.
    expect(container.querySelector('[data-testid="period-bar-mobile"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="period-bar-mobile"]')?.className ?? '').toMatch(
      /period-bar-mobile/,
    );
    // The full-bar subtree is also present (visibility is purely CSS-driven
    // so jsdom doesn't hide it). This guards against accidental conditional
    // rendering that would cause a hydration flicker between breakpoints.
    expect(container.querySelector('[data-testid="period-bar-full"]')).toBeTruthy();
  });

  it('renders full 44px variant in DOM at viewport 1280px (> 640)', async () => {
    global.innerWidth = 1280;
    await act(async () => {
      root.render(<PeriodBar />);
    });
    const wrapper = container.firstChild as HTMLElement | null;
    expect(wrapper?.className ?? '').toMatch(/period-bar--lesson/);
    // At desktop width the full-height bar (44px) is the visible one.
    expect(container.querySelector('[data-testid="period-bar-full"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="period-bar-full"]')?.className ?? '').toMatch(
      /period-bar-full/,
    );
    // The mobile-only subtree is still rendered but hidden via
    // `display: none` in the default (non-mobile) media-query branch.
    expect(container.querySelector('[data-testid="period-bar-mobile"]')).toBeTruthy();
  });
});
