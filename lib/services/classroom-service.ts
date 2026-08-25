import { useStageStore } from '@/lib/store/stage';
import type { RaiseHandAction, PeriodEndAction } from '@openmaic/dsl';

export interface CallRaiseHandOpts {
  agentId: string;
  agentName: string;
  origin: 'user' | 'agent';
  question?: string;
  /**
   * Optional Director graph hook (NOT called by default; classroom shell
   * is isolated per spec §10 D-1). Provided only for callers that want
   * to also notify the Director.
   */
  directorHook?: () => void;
  cueUserHook?: () => Promise<void>;
}

/**
 * Isolated raise-hand entry point (D-1). Does NOT mutate Director graph.
 * Director integration is one-way: agents can be wired to call this when
 * they want to raise a hand, but classroom raise-hand events never reach
 * the Director's main control flow. This guarantees the existing Socratic
 * Director graph is unaffected when classroom shell is enabled.
 */
export const ClassroomService = {
  async callRaiseHand(opts: CallRaiseHandOpts): Promise<void> {
    const action: RaiseHandAction = {
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'raise_hand',
      agent_id: opts.agentId,
      agent_name: opts.agentName,
      raised_at: Date.now(),
      origin: opts.origin,
      question: opts.question,
    };

    // 1. Always dispatch to classroom store (primary path)
    useStageStore.getState().dispatchClassroomAction(action);

    // 2. Optional Director hook — fail-safe (errors swallowed, spec §10)
    if (opts.directorHook) {
      try { opts.directorHook(); } catch { /* isolate */ }
    }

    // 3. Optional cue_user hook (only used when queue full + auto-cue logic kicks in)
    if (opts.cueUserHook) {
      try { await opts.cueUserHook(); } catch { /* isolate */ }
    }
  },

  /**
   * Auto-period_end timer (Task 3 / L2). When `period_start` sets
   * `periodEndsAt`, the reducer calls this with the remaining ms so a
   * `period_end` dispatch lands exactly when the lesson window closes
   * — even if the Director never sends the manual `period_end` (spec
   * §7 failure handling: "Director 不阻塞，超时自动 period_end").
   *
   * Returns a cancel function the manual `period_end` path (and any
   * reducer case that supersedes the timer) MUST invoke so a stale
   * auto-end cannot race a fresh period_start, e.g. on break → lesson.
   * The dispatched action is shaped like a Director `period_end` —
   * `agent_id: 'director'`, `is_last_lesson: false` — so the reducer's
   * period transition is identical to the manual path.
   */
  scheduleAutoEnd(ms: number): () => void {
    let fired = false;
    const id = setTimeout(() => {
      fired = true;
      const action: PeriodEndAction = {
        id: `auto-period-end-${Date.now()}`,
        type: 'period_end',
        agent_id: 'director',
        timestamp: Date.now(),
        break_duration: 0,
        is_last_lesson: false,
      };
      useStageStore.getState().dispatchClassroomAction(action);
    }, ms);
    return () => {
      if (fired) return;
      clearTimeout(id);
    };
  },
};
