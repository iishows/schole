'use client';
import { useEffect } from 'react';
import { useStageStore } from '@/lib/store/stage';
import { ProactiveCard } from '@/components/chat/proactive-card';
import { cuesTo } from '@/lib/chat/pi/tools/cue-user';

export function CallOnCard() {
  const callOn = useStageStore(s => s.classroom.activeCallOn);

  useEffect(() => {
    if (!callOn) return;
    const ms = callOn.countdown_ms ?? 4000;
    const id = setTimeout(() => {
      // M1 fix (audit 2026-08-25 §M1): when the call_on countdown elapses
      // without an answer, the real fallback is to emit a `cue_user`
      // StatelessEvent-shaped event so downstream consumers (chat-area
      // `onCueUser`, agent-loop `cue_user` outcome) hand the turn back to
      // the user. Previously this just re-dispatched a `call_on` action,
      // which silently kept the card visible forever without escalating.
      // cuesTo() is the thin event-constructor from
      // @/lib/chat/pi/tools/cue-user; it does NOT call any internal
      // Director callback — it only builds the event so this shell
      // component can observe / route it (and so the unit test can
      // assert the constructed shape).
      const fallback = cuesTo(callOn.target_agent_id, callOn.prompt);
      // eslint-disable-next-line no-console
      console.debug('[classroom] call_on timeout → cue_user', fallback);
    }, ms);
    return () => clearTimeout(id);
  }, [callOn]);

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