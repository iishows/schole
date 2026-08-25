'use client';
import { useEffect, useRef, useState } from 'react';
import { useStageStore } from '@/lib/store/stage';
import { isClassroomShellEnabled } from '@/lib/config/feature-flags';
import { buildChalkSvg } from '@/lib/utils/chalk-stroke-svg';

export function BlackboardToggle() {
  const enabled = isClassroomShellEnabled();
  const mode = useStageStore(s => s.classroom.blackboardMode);
  const dispatch = useStageStore(s => s.dispatchClassroomAction);
  if (!enabled) return null;
  return (
    <div className="canvas-tab-bar" role="tablist">
      <button
        role="tab"
        aria-selected={!mode}
        onClick={() => {
          if (mode) dispatch({
            type: 'blackboard_annotate', id: `b-toggle-${Date.now()}`,
            layer: 'blackboard', path: [], duration: 0,
            agent_id: 'user', timestamp: Date.now(),
          });
        }}
        data-testid="tab-slide"
      >📑 幻灯片</button>
      <button
        role="tab"
        aria-selected={mode}
        onClick={() => {
          if (!mode) dispatch({
            type: 'blackboard_annotate', id: `b-on-${Date.now()}`,
            layer: 'blackboard', path: [{ x: 0, y: 0 }],
            duration: 100,
            agent_id: 'user', timestamp: Date.now(),
          });
        }}
        data-testid="tab-blackboard"
      >📝 白板</button>
    </div>
  );
}

/**
 * M3 fix (audit 2026-08-25 §M3): spec §7 promises that when a
 * `blackboard_annotate` action triggers auto-toggle from non-blackboard
 * → blackboard mode, a transient toast warns the user that the teacher
 * agent has just flipped them into blackboard mode. Previously the
 * reducer (Task 11) silently flipped `blackboardMode = true` with no
 * visible signal, leaving the user disoriented.
 *
 * The toast is a 3-second auto-dismiss banner keyed off the
 * `blackboardMode` false→true edge, captured via a ref-tracked previous
 * value (a simple `[prevMode, mode]` tuple isn't enough because
 * `mode=true` is already the post-flip state by the time the effect
 * runs after a dispatch).
 */
export function BlackboardChalkLayer() {
  const enabled = isClassroomShellEnabled();
  const mode = useStageStore(s => s.classroom.blackboardMode);
  const strokes = useStageStore(s => (s.classroom as any).chalkStrokes ?? []);
  // Track the previously observed mode so we can detect the false→true edge.
  const prevModeRef = useRef<boolean>(mode);
  const [autoOpenToast, setAutoOpenToast] = useState(false);
  useEffect(() => {
    // Edge detection: only fire on false → true transitions, not on initial
    // mount with mode=true or no-op same-mode renders.
    const wasFalse = !prevModeRef.current;
    prevModeRef.current = mode;
    if (wasFalse && mode) {
      setAutoOpenToast(true);
      const id = window.setTimeout(() => setAutoOpenToast(false), 3000);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [mode]);
  if (!enabled) return null;
  return (
    <>
      {autoOpenToast && (
        <div
          role="status"
          aria-live="polite"
          className="blackboard-auto-open-toast"
          data-testid="blackboard-auto-open-toast"
        >
          📝 黑板已开启
        </div>
      )}
      {mode && (
        <svg
          className="blackboard-chalk"
          data-testid="blackboard-chalk-svg"
          viewBox="0 0 1000 600"
        >
          <defs>
            <filter id="chalk-rough" data-testid="chalk-turbulence">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
              <feDisplacementMap in="SourceGraphic" scale="2" />
            </filter>
          </defs>
          <rect width="1000" height="600" fill="#1f3a2f" />
          <g dangerouslySetInnerHTML={{ __html: buildChalkSvg(strokes) }} />
        </svg>
      )}
    </>
  );
}