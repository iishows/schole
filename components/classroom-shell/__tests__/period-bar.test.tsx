// @vitest-environment jsdom
// Test environment note (Task 6 deviation):
//   1. `@testing-library/react` is not a project dependency and Task 6's
//      "DO NOT" list prohibits adding new deps, so we drive the component via
//      `react-dom/client.createRoot` + `act()` (already in `react-dom`) instead
//      of `render()` + `screen.getBy*`.
//   2. zustand v5's `useStore` uses `api.getInitialState()` as its React
//      `useSyncExternalStore` server snapshot, so `setState` calls made
//      before `renderToString` are invisible to SSR. Client-side render via
//      `createRoot` uses `api.getState()` instead and reflects pre-mount
//      mutations correctly, which is what these three assertions need.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { PeriodBar } from '../period-bar';
import { useStageStore } from '@/lib/store/stage';
import { isClassroomShellEnabled } from '@/lib/config/feature-flags';

// React's `act()` helper needs this global flag to silence the
// "not configured to support act(...)" warning under vitest.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Mock the Web Audio hook so the test never touches `window.AudioContext`.
// vi.mock is hoisted to the top of the file by vitest.
vi.mock('@/lib/hooks/use-period-bar-bell', () => ({
  usePeriodBarBell: () => ({
    playBell: vi.fn(),
    playTransition: vi.fn(),
    playAttention: vi.fn(),
    playWrap: vi.fn(),
  }),
}));

describe('PeriodBar', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    // Enable the classroom shell by default; the dedicated disabled test
    // deletes this env var so isClassroomShellEnabled() reads false.
    process.env.NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED = 'true';
    useStageStore.getState().resetClassroom?.();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders lesson label and live mm:ss countdown when period=lesson', async () => {
    useStageStore.setState((s) => ({
      ...s,
      classroom: {
        ...s.classroom,
        period: 'lesson',
        periodStartedAt: Date.now() - 30_000,
        periodEndsAt: Date.now() + 30_000,
        lessonLabel: '异分母分数加法',
      },
    }));
    await act(async () => {
      root.render(<PeriodBar />);
    });
    const html = container.innerHTML;
    // Lesson label surfaces verbatim inside the rendered bar.
    expect(html).toMatch(/异分母分数加法/);
    // Countdown is formatted as mm:ss.
    expect(html).toMatch(/\d{2}:\d{2}/);
    // The lesson-mode CSS hook is attached so the bar gets the right palette.
    const first = container.firstChild as HTMLElement | null;
    expect(first?.className ?? '').toMatch(/period-bar--lesson/);
  });

  it('renders break-mode CSS class when period=break', async () => {
    useStageStore.setState((s) => ({
      ...s,
      classroom: { ...s.classroom, period: 'break' },
    }));
    await act(async () => {
      root.render(<PeriodBar />);
    });
    // Equivalent of plan's `container.firstChild` having the break modifier
    // class — `toHaveClass(/break/)`.
    const first = container.firstChild as HTMLElement | null;
    expect(first?.className ?? '').toMatch(/period-bar--break/);
  });

  it('renders nothing when the classroom shell feature flag is disabled', async () => {
    // Drop the env var so isClassroomShellEnabled() reads false at the
    // next call. The function reads inline at call time, not at module
    // init, so no module reset is required.
    delete process.env.NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED;
    expect(isClassroomShellEnabled()).toBe(false);
    await act(async () => {
      root.render(<PeriodBar />);
    });
    expect(container.firstChild).toBeNull();
  });
});