'use client';
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

export function BlackboardChalkLayer() {
  const enabled = isClassroomShellEnabled();
  const mode = useStageStore(s => s.classroom.blackboardMode);
  const strokes = useStageStore(s => (s.classroom as any).chalkStrokes ?? []);
  if (!enabled || !mode) return null;
  const inner = buildChalkSvg(strokes);
  return (
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
      <g dangerouslySetInnerHTML={{ __html: inner }} />
    </svg>
  );
}