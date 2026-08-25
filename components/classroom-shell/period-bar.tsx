'use client';
import { useEffect, useState } from 'react';
import { useStageStore } from '@/lib/store/stage';
import { isClassroomShellEnabled } from '@/lib/config/feature-flags';
import { usePeriodBarBell } from '@/lib/hooks/use-period-bar-bell';

function formatCountdown(ms: number): string {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * PeriodBar — 44px top status bar showing the current classroom period.
 *
 * Behaviour:
 *  - `before-class` / `after-class` : renders nothing (bar only makes sense
 *    while a lesson or break is in flight).
 *  - `lesson` : shows "🔔 第 N 节 · <label>" + live mm:ss countdown that
 *    re-renders every 1s via a `force` tick.
 *  - `break`  : shows "🔔 课间" + a static amber-coloured bar. The bell
 *    fires exactly once on transition into break via `usePeriodBarBell`.
 *
 * Gating: when `isClassroomShellEnabled()` returns false the component
 * returns `null` and nothing is mounted — RoundTable's existing layout is
 * therefore byte-identical to pre-Task 6 with the flag off.
 */
export function PeriodBar() {
  const enabled = isClassroomShellEnabled();
  const classroom = useStageStore((s) => s.classroom);
  const { playTransition } = usePeriodBarBell();
  const [, force] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (classroom.period === 'lesson' && classroom.periodEndsAt) {
      const id = setInterval(() => force((n) => n + 1), 1000);
      return () => clearInterval(id);
    }
  }, [enabled, classroom.period, classroom.periodEndsAt]);

  useEffect(() => {
    if (classroom.period === 'break') playTransition();
  }, [classroom.period, playTransition]);

  if (!enabled) return null;
  if (classroom.period === 'before-class' || classroom.period === 'after-class') return null;

  const remaining = classroom.periodEndsAt ? classroom.periodEndsAt - Date.now() : 0;
  return (
    <div className={`period-bar period-bar--${classroom.period}`} data-testid="period-bar">
      <span className="period-bar__label">
        {classroom.period === 'break'
          ? '🔔 课间'
          : `🔔 第 ${classroom.lessonLabel.match(/\d+/)?.[0] ?? ''} 节 · ${classroom.lessonLabel.replace(/^Lesson-\d+\s*/, '')}`}
      </span>
      <span className="period-bar__countdown">{formatCountdown(remaining)}</span>
    </div>
  );
}