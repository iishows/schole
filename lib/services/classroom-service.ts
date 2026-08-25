import { useStageStore } from '@/lib/store/stage';
import type { RaiseHandAction } from '@openmaic/dsl';

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
};
