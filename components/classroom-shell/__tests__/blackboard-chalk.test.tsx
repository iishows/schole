// @vitest-environment jsdom
// Test environment note (mirrors Task 6/7/10 deviation in period-bar/
// hand-raise/pass-note tests):
//   `@testing-library/react` is not a project dependency and Task 11's
//   "DO NOT" list prohibits adding new deps, so we drive the component via
//   `react-dom/client.createRoot` + `act()` (already in `react-dom`) instead
//   of `render()` + `screen.getBy*`. Data-testid queries are written against
//   `container.querySelector(...)` directly.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { BlackboardChalkLayer, BlackboardToggle } from '../blackboard-chalk-layer';
import { useStageStore } from '@/lib/store/stage';

// React's `act()` helper needs this global flag to silence the
// "not configured to support act(...)" warning under vitest.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Plan Step 1 calls for vi.mock of feature-flags; this matches Task 5's
// engine-classroom test pattern. Use vi.mock instead of mutating process.env
// so the components read `true` from the inline `isClassroomShellEnabled()`
// call.
vi.mock('@/lib/config/feature-flags', () => ({ isClassroomShellEnabled: () => true }));

describe('BlackboardChalkLayer', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
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

  it('renders nothing when blackboardMode=false', async () => {
    useStageStore.setState((s) => ({
      ...s,
      classroom: { ...s.classroom, blackboardMode: false },
    }));
    await act(async () => {
      root.render(<BlackboardChalkLayer />);
    });
    // Equivalent of plan's `container.firstChild` being null.
    expect(container.firstChild).toBeNull();
  });

  it('renders SVG with chalk filter when blackboardMode=true and strokes present', async () => {
    useStageStore.setState((s) => ({
      ...s,
      classroom: {
        ...s.classroom,
        blackboardMode: true,
        chalkStrokes: [
          { path: [{ x: 10, y: 10 }, { x: 20, y: 20 }], color: '#fff' },
        ],
      },
    }));
    await act(async () => {
      root.render(<BlackboardChalkLayer />);
    });
    // Equivalent of plan's `screen.getByTestId('blackboard-chalk-svg')`.
    expect(container.querySelector('[data-testid="blackboard-chalk-svg"]')).not.toBeNull();
    // Equivalent of plan's `screen.getByTestId('chalk-turbulence')`.
    expect(container.querySelector('[data-testid="chalk-turbulence"]')).not.toBeNull();
    // The feTurbulence + feDisplacementMap chalk filter is rendered.
    const feTurb = container.querySelector('feTurbulence');
    expect(feTurb).not.toBeNull();
    const feDisp = container.querySelector('feDisplacementMap');
    expect(feDisp).not.toBeNull();
  });

  it('BlackboardToggle switches mode: 白板 tab not selected at mode=false; clicking it flips mode to true', async () => {
    useStageStore.setState((s) => ({
      ...s,
      classroom: { ...s.classroom, blackboardMode: false },
    }));
    await act(async () => {
      root.render(<BlackboardToggle />);
    });
    // Equivalent of plan's `screen.getByRole('tab', { name: /白板/ })`
    // — find the 白板 tab and assert its aria-selected reflects mode=false.
    const blackboardTab = container.querySelector('[data-testid="tab-blackboard"]') as HTMLButtonElement | null;
    expect(blackboardTab).not.toBeNull();
    expect(blackboardTab!.getAttribute('aria-selected')).toBe('false');
    // The 幻灯片 tab is the active one when mode=false.
    const slideTab = container.querySelector('[data-testid="tab-slide"]') as HTMLButtonElement | null;
    expect(slideTab).not.toBeNull();
    expect(slideTab!.getAttribute('aria-selected')).toBe('true');
    // Clicking the 白板 tab dispatches blackboard_annotate → reducer flips
    // mode to true.
    await act(async () => {
      blackboardTab!.click();
    });
    expect(useStageStore.getState().classroom.blackboardMode).toBe(true);
  });
});