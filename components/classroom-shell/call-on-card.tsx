'use client';
import { useEffect } from 'react';
import { useStageStore } from '@/lib/store/stage';
import { ProactiveCard } from '@/components/chat/proactive-card';

export function CallOnCard() {
  const callOn = useStageStore(s => s.classroom.activeCallOn);
  const dispatch = useStageStore(s => s.dispatchClassroomAction);

  useEffect(() => {
    if (!callOn) return;
    const ms = callOn.countdown_ms ?? 4000;
    const id = setTimeout(() => {
      // fallback to cue_user (existing mechanism, no break)
      dispatch({
        type: 'call_on', id: `c-clear-${Date.now()}`,
        target_agent_id: callOn.target_agent_id,
        prompt: callOn.prompt, agent_id: 'system',
        timestamp: Date.now(),
      });
      // dispatch clear via period_bell + reducer extension (out of scope; keep card visible until answered)
    }, ms);
    return () => clearTimeout(id);
  }, [callOn, dispatch]);

  if (!callOn) return null;
  return (
    <ProactiveCard
      displayMode="call_on"
      callOnTitle="请回答"
      callOnPrompt={callOn.prompt}
      targetAgentId={callOn.target_agent_id}
      countdownMs={callOn.countdown_ms ?? 4000}
      data-testid="call-on-card"
    />
  );
}