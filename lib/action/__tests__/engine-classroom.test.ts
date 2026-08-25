/**
 * ActionEngine ↔ classroom-shell wiring (Task 5).
 *
 * Verifies the engine's `execute()` switch drops classroom actions through
 * to `useStageStore.getState().dispatchClassroomAction()` when both feature
 * flags are on, and silently drops them when either gate fails — without
 * touching any of the 22 standard action handlers above.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionEngine } from '../engine';
import { useStageStore } from '@/lib/store/stage';

vi.mock('@/lib/config/feature-flags', () => ({
  isClassroomShellEnabled: () => true,
  isClassroomShellInjected: () => true,
}));

describe('ActionEngine classroom shell dispatch (Task 5)', () => {
  beforeEach(() => {
    // Reset classroom slice between cases so queue length / period assertions
    // are not polluted by earlier cases (mirrors the stage-classroom-integration
    // test harness pattern).
    useStageStore.getState().resetClassroom?.();
  });

  it('dispatches period_start to the stage store classroom reducer', async () => {
    const engine = new ActionEngine(useStageStore);
    await engine.execute({
      type: 'period_start',
      id: 'p',
      period: 'L1',
      duration: 60,
      agenda: ['导入'],
      agent_id: 't',
      timestamp: Date.now(),
    });
    expect(useStageStore.getState().classroom.period).toBe('lesson');
  });

  it('dispatches raise_hand into the FIFO queue', async () => {
    const engine = new ActionEngine(useStageStore);
    await engine.execute({
      type: 'raise_hand',
      id: 'r',
      agent_id: 'a1',
      agent_name: '小红',
      raised_at: Date.now(),
      origin: 'agent',
    });
    const q = useStageStore.getState().classroom.handRaiseQueue;
    expect(q).toHaveLength(1);
    expect(q[0].agent_id).toBe('a1');
    expect(q[0].origin).toBe('agent');
  });

  it('drops classroom actions when feature flag is disabled', async () => {
    // Reset the module graph so the doMock below is picked up by the next
    // import — `vi.mock` at the top of the file would otherwise win.
    vi.resetModules();
    vi.doMock('@/lib/config/feature-flags', () => ({
      isClassroomShellEnabled: () => false,
      isClassroomShellInjected: () => false,
    }));
    const { ActionEngine: AE } = await import('../engine');
    const { useStageStore: USS } = await import('@/lib/store/stage');
    USS.getState().resetClassroom?.();

    const engine = new AE(USS);
    await engine.execute({
      type: 'period_start',
      id: 'p',
      period: 'L1',
      duration: 60,
      agenda: ['导入'],
      agent_id: 't',
      timestamp: Date.now(),
    });
    // The action should have been dropped before reaching dispatchClassroomAction,
    // so the period stays at its seeded `before-class` value.
    expect(USS.getState().classroom.period).toBe('before-class');
    expect(USS.getState().classroom.handRaiseQueue).toEqual([]);
  });
});