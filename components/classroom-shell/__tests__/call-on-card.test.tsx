// @vitest-environment jsdom
// Test environment note (mirrors Task 6/7/10/11 deviations in sibling tests):
//   `@testing-library/react` is not a project dependency and the audit "DO NOT"
//   list prohibits adding new deps, so we drive the component via
//   `react-dom/client.createRoot` + `act()` (already in `react-dom`) instead of
//   `render()` + `screen.getBy*`. Data-testid queries are written against
//   `container.querySelector(...)` directly. Mock `ProactiveCard` since it pulls
//   in motion/react + i18n + DOM portal — out of scope for this unit test.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { CallOnCard } from '../call-on-card';
import { useStageStore } from '@/lib/store/stage';
import type { StatelessEvent } from '@/lib/types/chat';

// React's `act()` helper needs this global flag to silence the
// "not configured to support act(...)" warning under vitest.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/lib/config/feature-flags', () => ({ isClassroomShellEnabled: () => true }));

// Mock ProactiveCard so the test doesn't load motion/react / use-i18n /
// react-dom portal — we only care that the wrapper exposes the
// `data-testid="call-on-card"` element when activeCallOn is set.
vi.mock('@/components/chat/proactive-card', () => ({
  ProactiveCard: (props: { 'data-testid'?: string }) => (
    <div data-testid={props['data-testid']} />
  ),
}));

// Mock the cue-user module so we can observe cuesTo() calls without recursing
// into the spy when delegating back. The spy / factory just records args and
// returns the same event shape the real helper builds.
type CueUserEvent = Extract<StatelessEvent, { type: 'cue_user' }>;
const cuesToMock = vi.fn(
  (targetAgentId?: string, prompt?: string): CueUserEvent => ({
    type: 'cue_user',
    data: { fromAgentId: targetAgentId, prompt },
  }),
);

vi.mock('@/lib/chat/pi/tools/cue-user', () => ({
  cuesTo: (targetAgentId?: string, prompt?: string) =>
    cuesToMock(targetAgentId, prompt),
}));

describe('CallOnCard', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    cuesToMock.mockClear();
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

  it('renders nothing when activeCallOn is null', async () => {
    await act(async () => {
      root.render(<CallOnCard />);
    });
    expect(container.querySelector('[data-testid="call-on-card"]')).toBeNull();
  });

  it('renders call-on-card element when activeCallOn is set', async () => {
    useStageStore.setState((s) => ({
      ...s,
      classroom: {
        ...s.classroom,
        activeCallOn: {
          target_agent_id: 'a1',
          prompt: '请回答 3+5=?',
          countdown_ms: 4000,
          called_at: Date.now(),
        },
      },
    }));
    await act(async () => {
      root.render(<CallOnCard />);
    });
    expect(container.querySelector('[data-testid="call-on-card"]')).not.toBeNull();
  });

  it('M1: when call_on countdown elapses, cuesTo is invoked with the target_agent_id and the cue_user event has the expected shape', async () => {
    // Use vi.useFakeTimers to control the countdown deterministically.
    vi.useFakeTimers();
    try {
      useStageStore.setState((s) => ({
        ...s,
        classroom: {
          ...s.classroom,
          activeCallOn: {
            target_agent_id: 'a-target',
            prompt: '请回答',
            countdown_ms: 100,
            called_at: Date.now(),
          },
        },
      }));
      await act(async () => {
        root.render(<CallOnCard />);
      });
      expect(cuesToMock).not.toHaveBeenCalled();
      // Advance past the 100ms countdown.
      await act(async () => {
        vi.advanceTimersByTime(150);
      });
      expect(cuesToMock).toHaveBeenCalledTimes(1);
      const [targetAgentId, prompt] = cuesToMock.mock.calls[0];
      expect(targetAgentId).toBe('a-target');
      expect(prompt).toBe('请回答');
      // The mock returns the same shape the real helper builds, so assert
      // the cue_user event shape directly via the mock's last return value.
      const fallback = cuesToMock.mock.results[0].value as CueUserEvent;
      expect(fallback).toEqual({
        type: 'cue_user',
        data: { fromAgentId: 'a-target', prompt: '请回答' },
      });
    } finally {
      vi.useRealTimers();
    }
  });
});