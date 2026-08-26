// @vitest-environment jsdom
//
// Component tests for B.1.5 — <WhiteboardFullscreenView />.
//
// Mirrors the same low-dependency testing approach used elsewhere
// in the demo-shell suite:
//   - no `@testing-library/react` (Global Constraint 17 bans new deps),
//   - render via `react-dom/client.createRoot` + `act()`,
//   - query the DOM through `container.querySelector(...)` against
//     the `data-testid` hooks the components expose.
//
// We seed `useStageStore` so `<FrontBlackboard />` (which reads
// `blackboardMode` + `lessonLabel` from the store) actually mounts
// inside the view.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import {
  WhiteboardFullscreenView,
  type WhiteboardFullscreenViewProps,
} from '../whiteboard-fullscreen-view';
import type { DemoSlide } from '@/lib/classroom/demo-data-generator';
import { useStageStore } from '@/lib/store/stage';
import * as featureFlags from '@/lib/config/feature-flags';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function makeSlides(count: number): DemoSlide[] {
  const out: DemoSlide[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push({
      title: `slide-${i}`,
      step: `第 ${i + 1} 节`,
      chalkStrokes: [],
    });
  }
  return out;
}

describe('<WhiteboardFullscreenView /> (B.1.5)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.spyOn(featureFlags, 'isClassroomFrontEnabled').mockReturnValue(true);
    useStageStore.getState().resetClassroom?.();
    useStageStore.setState((s) => ({
      ...s,
      classroom: {
        ...s.classroom,
        period: 'lesson',
        lessonLabel: 'Lesson-3 数学·通分',
        blackboardMode: true,
        chalkStrokes: [],
        seatLayout: [
          { seat_id: 'D1', agent_id: 'agent-0-👧', deskmates: [], zone: 'front' },
          { seat_id: 'D2', agent_id: 'agent-1-👦', deskmates: [], zone: 'front' },
        ],
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
    vi.restoreAllMocks();
  });

  const defaultProps = (overrides: Partial<WhiteboardFullscreenViewProps> = {}): WhiteboardFullscreenViewProps => ({
    slides: makeSlides(3),
    currentSlide: 0,
    onSlideChange: vi.fn(),
    autoCycle: false,
    autoCycleMs: 8000,
    onAutoCycleToggle: vi.fn(),
    ...overrides,
  });

  it('renders only the blackboard + slide tabs (no desks / teacher / chat)', async () => {
    await act(async () => {
      root.render(<WhiteboardFullscreenView {...defaultProps()} />);
    });
    // Blackboard + slide switcher are present.
    expect(container.querySelector('[data-testid="whiteboard-fullscreen-view"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="front-blackboard"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="front-blackboard-slide-tabs"]')).toBeTruthy();
    // Each slide gets a tab button.
    const tabs = container.querySelectorAll('[data-testid^="front-blackboard-slide-tab-"]');
    expect(tabs.length).toBe(3);
    // No classroom-only widgets.
    expect(container.querySelector('[data-testid="front-desks"]')).toBeNull();
    expect(container.querySelector('[data-testid="teacher-stage"]')).toBeNull();
    expect(container.querySelector('[data-testid="demo-chat-history"]')).toBeNull();
    expect(container.querySelector('[data-testid="demo-assignment-panel"]')).toBeNull();
    expect(container.querySelector('[data-testid="demo-right-column"]')).toBeNull();
  });

  it('exposes the active slide index via data-current-slide', async () => {
    await act(async () => {
      root.render(<WhiteboardFullscreenView {...defaultProps({ currentSlide: 2 })} />);
    });
    const view = container.querySelector('[data-testid="whiteboard-fullscreen-view"]')!;
    expect(view.getAttribute('data-current-slide')).toBe('2');
    // The active slide tab inside the blackboard matches.
    const active = container.querySelector('[data-testid="front-blackboard-slide-tab-2"]')!;
    expect(active.getAttribute('data-active')).toBe('true');
  });

  it('renders -1 when no slides are supplied', async () => {
    await act(async () => {
      root.render(<WhiteboardFullscreenView {...defaultProps({ slides: undefined })} />);
    });
    const view = container.querySelector('[data-testid="whiteboard-fullscreen-view"]')!;
    expect(view.getAttribute('data-current-slide')).toBe('-1');
  });

  it('clicking a slide tab routes through onSlideChange', async () => {
    const onSlideChange = vi.fn();
    await act(async () => {
      root.render(<WhiteboardFullscreenView {...defaultProps({ onSlideChange })} />);
    });
    const tab = container.querySelector('[data-testid="front-blackboard-slide-tab-1"]')!;
    await act(async () => {
      tab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onSlideChange).toHaveBeenCalledTimes(1);
    expect(onSlideChange).toHaveBeenCalledWith(1);
  });

  it('clicking the auto-cycle toggle routes through onAutoCycleToggle', async () => {
    const onAutoCycleToggle = vi.fn();
    await act(async () => {
      root.render(
        <WhiteboardFullscreenView {...defaultProps({ onAutoCycleToggle })} />,
      );
    });
    const toggle = container.querySelector('[data-testid="front-blackboard-auto-cycle-toggle"]')!;
    await act(async () => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onAutoCycleToggle).toHaveBeenCalledTimes(1);
  });
});
