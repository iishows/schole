/**
 * ClassroomService.scheduleAutoEnd tests (Task 3 / L2).
 *
 * The auto-end timer drives `period_end` when `period_start` arms it
 * (D-1 isolation: only the classroom store sees the dispatch — the
 * Director graph is intentionally never wired in). The cancel function
 * returned by `scheduleAutoEnd` is what the manual `period_end` path
 * must call so an early end does not race a stale auto-end dispatch.
 *
 * Uses vi.useFakeTimers so the setTimeout inside the service can be
 * advanced deterministically without touching real wall-clock.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClassroomService } from '../classroom-service';

vi.mock('@/lib/store/stage', () => {
  const dispatchClassroomAction = vi.fn();
  return {
    useStageStore: {
      getState: () => ({
        classroom: { period: 'lesson' },
        dispatchClassroomAction,
        resetClassroom: vi.fn(),
      }),
    },
  };
});

describe('ClassroomService.scheduleAutoEnd (Task 3 / L2 auto period_end)', () => {
  let dispatchSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.useFakeTimers();
    const { useStageStore } = await import('@/lib/store/stage');
    dispatchSpy = useStageStore.getState().dispatchClassroomAction as ReturnType<typeof vi.fn>;
    dispatchSpy.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('dispatches period_end when the timer elapses', () => {
    ClassroomService.scheduleAutoEnd(1000);

    // Timer has not fired yet — no dispatch.
    expect(dispatchSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const action = dispatchSpy.mock.calls[0][0];
    expect(action.type).toBe('period_end');
    expect(action.is_last_lesson).toBe(false);
    expect(action.agent_id).toBe('director');
    expect(typeof action.timestamp).toBe('number');
    expect(typeof action.id).toBe('string');
    expect(action.id.length).toBeGreaterThan(0);
    expect(typeof action.break_duration).toBe('number');
  });

  it('cancel function prevents the timer from firing', () => {
    const cancel = ClassroomService.scheduleAutoEnd(1000);
    cancel();

    vi.advanceTimersByTime(5000);

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does not fire when the timer elapses only partially', () => {
    ClassroomService.scheduleAutoEnd(1000);

    vi.advanceTimersByTime(999);

    expect(dispatchSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });
});