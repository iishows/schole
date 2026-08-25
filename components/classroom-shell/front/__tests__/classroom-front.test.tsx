// @vitest-environment jsdom
//
// Test environment note (mirrors `period-bar-mobile.test.tsx`):
//   `@testing-library/react` is not a project dependency, and the B.1
//   plan §Global Constraint 17 prohibits new deps. We therefore drive
//   React via `react-dom/client.createRoot` + `act()` (already in
//   `react-dom`) instead of `render()` + `screen.getBy*`. Queries go
//   through `container.querySelector(...)` against the `data-testid`
//   hooks the components expose.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { ClassroomFront } from '../index';
import { useStageStore } from '@/lib/store/stage';
import * as featureFlags from '@/lib/config/feature-flags';

// React's `act()` helper needs this global flag to silence the
// "not configured to support act(...)" warning under vitest.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function makeClassroomState(
  overrides: Partial<{
    period: 'before-class' | 'lesson' | 'break' | 'after-class';
    lessonLabel: string;
    blackboardMode: boolean;
    chalkStrokes: Array<{ path: Array<{ x: number; y: number }> }>;
    seatLayout: Array<{ seat_id: string; agent_id: string; deskmates: string[]; zone: 'front' | 'middle' | 'back' }>;
  }> = {},
) {
  return {
    period: 'lesson' as const,
    lessonLabel: '数学',
    blackboardMode: true,
    chalkStrokes: [],
    seatLayout: [],
    ...overrides,
  };
}

describe('ClassroomFront (B.1)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    // Default: feature flag ON so the happy-path render test does not need
    // extra setup; the disabled-flag test re-mocks the module below.
    vi.spyOn(featureFlags, 'isClassroomFrontEnabled').mockReturnValue(true);
    useStageStore.getState().resetClassroom?.();
    useStageStore.setState((s) => ({
      ...s,
      classroom: { ...s.classroom, ...makeClassroomState() },
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

  it('returns null when the front flag is disabled', async () => {
    vi.spyOn(featureFlags, 'isClassroomFrontEnabled').mockReturnValue(false);
    await act(async () => {
      root.render(<ClassroomFront />);
    });
    // Disabled flag = entire subtree unmounted; no classroom-front wrapper.
    expect(container.querySelector('[data-testid="classroom-front"]')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it('returns null outside the lesson period', async () => {
    useStageStore.setState((s) => ({
      ...s,
      classroom: { ...s.classroom, period: 'break' },
    }));
    await act(async () => {
      root.render(<ClassroomFront />);
    });
    expect(container.querySelector('[data-testid="classroom-front"]')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it('renders the front container, blackboard, teacher stage, and avatar when flag enabled', async () => {
    await act(async () => {
      root.render(<ClassroomFront />);
    });
    expect(container.querySelector('[data-testid="classroom-front"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="front-blackboard"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="teacher-stage"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="teacher-avatar"]')).toBeTruthy();
    // Blackboard should expose its step label so it is identifiable in
    // visual snapshots / integration tests.
    expect(container.querySelector('[data-testid="front-blackboard"]')?.textContent ?? '').toContain(
      '学习中',
    );
    // Teacher avatar carries the name plate for screen-reader + a11y tests.
    expect(container.querySelector('[data-testid="teacher-avatar"]')?.textContent ?? '').toContain(
      '小诺姐姐',
    );
  });

  it('renders a Desk per seatLayout entry (4-column grid driven by store)', async () => {
    useStageStore.setState((s) => ({
      ...s,
      classroom: {
        ...s.classroom,
        seatLayout: [
          { seat_id: 'A1', agent_id: 'alice', deskmates: [], zone: 'front' },
          { seat_id: 'A2', agent_id: 'bob', deskmates: [], zone: 'front' },
        ],
      },
    }));
    await act(async () => {
      root.render(<ClassroomFront />);
    });
    expect(container.querySelectorAll('[data-testid^="desk-"]').length).toBe(2);
    expect(container.querySelector('[data-testid="desk-A1"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="desk-A2"]')).toBeTruthy();
    // Each desk should render its student avatar with the seat's agent id
    // baked into the testid so e2e snapshots / future state-based selectors
    // can locate a specific seat without relying on positional queries.
    expect(container.querySelector('[data-testid="student-avatar-alice"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="student-avatar-bob"]')).toBeTruthy();
  });

  it('hides the blackboard subtree when blackboardMode is false', async () => {
    useStageStore.setState((s) => ({
      ...s,
      classroom: { ...s.classroom, blackboardMode: false },
    }));
    await act(async () => {
      root.render(<ClassroomFront />);
    });
    // Front container + teacher stage still render (the teacher is always
    // present during the lesson), but the blackboard is toggled off.
    expect(container.querySelector('[data-testid="classroom-front"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="teacher-stage"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="front-blackboard"]')).toBeNull();
  });

  it('mounts the whisper-line SVG and only draws a path when activeNote is present', async () => {
    // Without activeNote the SVG is empty (no path child).
    await act(async () => {
      root.render(<ClassroomFront />);
    });
    const whisperSvg = container.querySelector('[data-testid="whisper-line"]');
    expect(whisperSvg).toBeTruthy();
    expect(container.querySelector('[data-testid="whisper-line-path"]')).toBeNull();

    // With activeNote the path is rendered.
    useStageStore.setState((s) => ({
      ...s,
      classroom: {
        ...s.classroom,
        activeNote: { from_seat: 'A1', to_seat: 'A2', content: 'test', animation: 'fly' },
      },
    }));
    await act(async () => {
      root.render(<ClassroomFront />);
    });
    expect(container.querySelector('[data-testid="whisper-line-path"]')).toBeTruthy();
  });
});
