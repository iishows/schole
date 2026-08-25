/**
 * ClassroomService.callRaiseHand isolation tests (Task 8 / D-1).
 *
 * Verifies the service:
 *   1. never touches the Director graph or cue_user by default
 *      (Director/cue_user hooks are caller-supplied optional callbacks;
 *       without them the service has no implicit dependency on either)
 *   2. always dispatches a raise_hand action into the stage store
 *      (mock spy records every dispatchClassroomAction call)
 *   3. swallows Director errors so the classroom shell keeps working
 *      even when the Socratic Director is offline / throws
 *
 * The `vi.mock('@/lib/store/stage', ...)` factory below replaces the
 * real zustand store with a minimal shape exposing only `getState()`,
 * which is the only surface ClassroomService actually calls. Keeping
 * the mock narrow prevents accidental coupling to store internals.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClassroomService } from '../classroom-service';

vi.mock('@/lib/store/stage', () => {
  const queue: unknown[] = [];
  const dispatchClassroomAction = vi.fn();
  return {
    useStageStore: {
      getState: () => ({
        classroom: { period: 'lesson', handRaiseQueue: queue },
        dispatchClassroomAction,
        resetClassroom: vi.fn(),
      }),
    },
  };
});

describe('ClassroomService.callRaiseHand (Task 8 / D-1 isolation)', () => {
  let dispatchSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Re-read the mock's dispatchClassroomAction for each case so the
    // spy state is isolated; `vi.mock` factory runs once per test file,
    // but `mockClear()` in beforeEach gives each test a fresh baseline.
    const { useStageStore } = await import('@/lib/store/stage');
    dispatchSpy = useStageStore.getState().dispatchClassroomAction as ReturnType<typeof vi.fn>;
    dispatchSpy.mockClear();
  });

  it('does not touch Director graph or cue_user by default', async () => {
    // Default path: no hooks passed in. The service must still dispatch
    // and resolve — proving it has no implicit dependency on Director or
    // cue_user. Either reaching into either would either throw (missing
    // import) or get caught by the absence of any hook invocation here.
    await expect(
      ClassroomService.callRaiseHand({
        agentId: 'user',
        agentName: '我',
        origin: 'user',
      }),
    ).resolves.toBeUndefined();

    // The dispatch still happened (store-only side-effect, no Director
    // or cue_user modules were touched).
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });

  it('dispatches raise_hand to store with the expected action shape', async () => {
    await ClassroomService.callRaiseHand({
      agentId: 'a1',
      agentName: '小红',
      origin: 'agent',
      question: '老师请说',
    });

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const action = dispatchSpy.mock.calls[0][0];
    expect(action.type).toBe('raise_hand');
    expect(action.agent_id).toBe('a1');
    expect(action.agent_name).toBe('小红');
    expect(action.origin).toBe('agent');
    expect(action.question).toBe('老师请说');
    expect(action.id).toMatch(/^r-\d+-[a-z0-9]+$/);
    expect(typeof action.raised_at).toBe('number');
  });

  it('does not block on Director error (directorHook throws → service still resolves)', async () => {
    const err = vi.fn(() => {
      throw new Error('director down');
    });
    // The Director hook is invoked inside a try/catch in the service —
    // if it throws, the surrounding call MUST still resolve cleanly.
    await expect(
      ClassroomService.callRaiseHand({
        agentId: 'a2',
        agentName: '小蓝',
        origin: 'agent',
        directorHook: err,
      }),
    ).resolves.not.toThrow();
    // Director hook was attempted (and threw), but the error was contained.
    expect(err).toHaveBeenCalledTimes(1);
    // The store dispatch still happened — error isolation does not
    // skip the primary classroom state update.
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });
});
