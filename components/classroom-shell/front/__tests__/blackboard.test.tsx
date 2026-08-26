// @vitest-environment jsdom
//
// B.1.4 — Slide switcher tests for <FrontBlackboard />.
//
// Verifies:
//   - When `slides` is supplied, slide tabs render with one tab per slide.
//   - The active tab is highlighted via `.slideTabActive` + data-active.
//   - Clicking a tab fires `onSlideChange(idx)`.
//   - The auto-cycle toggle fires `onAutoCycleToggle`.
//   - When `autoCycle` is true, an interval advances the active slide.
//   - When `slides` is omitted the baseline `① 学习中` step text renders
//     (the snapshot fixture must keep this text).

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { FrontBlackboard } from '../blackboard';
import type { DemoSlide } from '@/lib/classroom/demo-data-generator';
import { useStageStore } from '@/lib/store/stage';
import * as featureFlags from '@/lib/config/feature-flags';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function makeSlide(idx: number, title = `Slide ${idx + 1}`): DemoSlide {
  const CIRCLE_DIGITS = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];
  const glyph = CIRCLE_DIGITS[idx + 1] ?? `${idx + 1}`;
  return {
    title,
    step: `${glyph} ${idx + 1} / 3 学习中`,
    chalkStrokes: [
      { path: [{ x: 10, y: 10 }, { x: 200, y: 50 }, { x: 400, y: 90 }], color: '#fff', width: 2 },
    ],
    teacherHint: idx === 0 ? '提示：先找公分母' : undefined,
  };
}

describe('FrontBlackboard (B.1.4 slide switcher)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.spyOn(featureFlags, 'isClassroomFrontEnabled').mockReturnValue(true);
    useStageStore.setState((s) => ({
      ...s,
      classroom: {
        ...s.classroom,
        period: 'lesson',
        lessonLabel: '数学',
        blackboardMode: true,
        chalkStrokes: [],
        seatLayout: [],
      },
    }));
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders slide tabs (one per slide) and highlights the active tab', async () => {
    const slides: DemoSlide[] = [makeSlide(0, '第 1 节'), makeSlide(1, '第 2 节'), makeSlide(2, '第 3 节')];
    await act(async () => {
      root.render(
        <FrontBlackboard
          lessonLabel="数学"
          slides={slides}
          currentSlide={1}
          onSlideChange={() => {}}
        />,
      );
    });
    const tabs = container.querySelectorAll('[data-testid^="front-blackboard-slide-tab-"]');
    expect(tabs.length).toBe(3);
    expect(tabs[1]?.getAttribute('data-active')).toBe('true');
    expect(tabs[0]?.getAttribute('data-active')).toBe('false');
    expect(tabs[2]?.getAttribute('data-active')).toBe('false');
    // Active step text reflects the chosen slide.
    const step = container.querySelector('[data-testid="front-blackboard-step"]')?.textContent ?? '';
    expect(step).toContain('②');
  });

  it('clicking a slide tab fires onSlideChange with the tab index', async () => {
    const slides: DemoSlide[] = [makeSlide(0), makeSlide(1), makeSlide(2)];
    const onSlideChange = vi.fn();
    await act(async () => {
      root.render(
        <FrontBlackboard
          lessonLabel="数学"
          slides={slides}
          currentSlide={0}
          onSlideChange={onSlideChange}
        />,
      );
    });
    const tab2 = container.querySelector('[data-testid="front-blackboard-slide-tab-2"]')!;
    await act(async () => {
      tab2.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onSlideChange).toHaveBeenCalledWith(2);
  });

  it('clicking the auto-cycle toggle fires onAutoCycleToggle', async () => {
    const slides: DemoSlide[] = [makeSlide(0), makeSlide(1)];
    const onAutoCycleToggle = vi.fn();
    await act(async () => {
      root.render(
        <FrontBlackboard
          lessonLabel="数学"
          slides={slides}
          currentSlide={0}
          onSlideChange={() => {}}
          autoCycle={false}
          onAutoCycleToggle={onAutoCycleToggle}
        />,
      );
    });
    const toggle = container.querySelector('[data-testid="front-blackboard-auto-cycle-toggle"]')!;
    await act(async () => {
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onAutoCycleToggle).toHaveBeenCalledTimes(1);
  });

  it('auto-cycle emits a fresh onSlideChange(idx) after autoCycleMs', async () => {
    const slides: DemoSlide[] = [makeSlide(0), makeSlide(1), makeSlide(2)];
    const onSlideChange = vi.fn();
    // Stateful holder — the parent owns the slide index so we can verify
    // each tick advances relative to the latest value.
    let current = 0;
    function rerender() {
      act(() => {
        root.render(
          <FrontBlackboard
            lessonLabel="数学"
            slides={slides}
            currentSlide={current}
            onSlideChange={(idx) => {
              onSlideChange(idx);
              current = idx;
            }}
            autoCycle={true}
            autoCycleMs={6000}
          />,
        );
      });
    }
    await act(async () => {
      rerender();
    });
    expect(onSlideChange).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(6000);
      rerender();
    });
    expect(onSlideChange).toHaveBeenLastCalledWith(1);
    await act(async () => {
      vi.advanceTimersByTime(6000);
      rerender();
    });
    expect(onSlideChange).toHaveBeenLastCalledWith(2);
    // Wraps around.
    await act(async () => {
      vi.advanceTimersByTime(6000);
      rerender();
    });
    expect(onSlideChange).toHaveBeenLastCalledWith(0);
  });

  it('fallback baseline: with no slides prop the board shows "① 学习中" (snapshot fixture compatibility)', async () => {
    await act(async () => {
      root.render(<FrontBlackboard lessonLabel="数学" />);
    });
    const step = container.querySelector('[data-testid="front-blackboard-step"]')?.textContent ?? '';
    expect(step).toContain('学习中');
    // No slide tabs when slides is undefined.
    expect(container.querySelector('[data-testid="front-blackboard-slide-tabs"]')).toBeNull();
  });
});
