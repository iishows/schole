'use client';

/**
 * Classroom Mode B.1 — front-view classroom container.
 *
 * Replaces the RoundTable central bubble area when
 * `isClassroomFrontEnabled()` returns true and `period === 'lesson'`. The
 * sub-components (`<FrontBlackboard />`, `<TeacherStage />`, `<Desks />`,
 * `<WhisperLine />`) read directly from `useStageStore` so no props are
 * passed except where the mockup requires static content (e.g. teacher
 * name "小诺姐姐").
 *
 * Phase B.1 only renders during the lesson period — before-class / break /
 * after-class fall back to V1.1 RoundTable playback (the RoundTable
 * container is the mount target, see app/classroom/[id]/page.tsx).
 *
 * B.1 Task 1 ships the blackboard + teacher stage. The desks grid and
 * whisper line land in Tasks 2 / 3 respectively.
 *
 * B.1.4 — forwards the new slide-deck props (slides / currentSlide /
 * onSlideChange / autoCycle / autoCycleMs / onAutoCycleToggle) from
 * `<DemoShell />` down to `<FrontBlackboard />` so the demo route can
 * drive slide state independently of the store-driven chalk strokes.
 *
 * B.1.6 — `thumbnailMode` prop. When `true`:
 *   - `<FrontBlackboard />` is NOT rendered (no big blackboard, no slide
 *     tabs — slide state stays lifted in `<DemoShell />` so it persists
 *     across view changes but isn't shown to the user in the classroom
 *     view).
 *   - `<TeacherStage />` is rendered in `compact` mode (small thumbnail
 *     in the top-right corner: podium + 36×36 avatar + name + 🎤 mic).
 *   - `<Desks />` still renders normally so the desks + bubbles fill
 *     the available area.
 * This is what powers the "🏫 教室" view tab — the user looks at the
 * students, with the teacher visible at-a-glance but not dominating.
 */

import { useStageStore } from '@/lib/store/stage';
import { isClassroomFrontEnabled } from '@/lib/config/feature-flags';
import type { DemoSlide } from '@/lib/classroom/demo-data-generator';
import { FrontBlackboard } from './blackboard';
import { TeacherStage } from './teacher-stage';
import { Desks } from './desks';
import { WhisperLine } from './whisper-line';
import styles from './classroom-front.module.css';

/** B.1.2 — optional demo props forwarded from `/classroom-demo`.
 *  When any of these are supplied the B.1 default mockup-faithful
 *  content is overridden. */
export interface ClassroomFrontDemoProps {
  teacherBubbleContent?: string;
  deskBubbleContents?: Record<string, string>;
  deskDisplayNames?: Record<string, string>;
  deskHandRaised?: Record<string, boolean>;
  activeCallOnAgentId?: string | null;
  // B.1.4 — slide switcher + auto-cycle. All optional so existing
  // consumers (snapshot fixture) keep working without changes.
  slides?: DemoSlide[];
  currentSlide?: number;
  onSlideChange?: (idx: number) => void;
  autoCycle?: boolean;
  autoCycleMs?: number;
  onAutoCycleToggle?: () => void;
  /** B.1.6 — when `true`, hide the blackboard + slide tabs and render
   *  the teacher stage as a compact thumbnail (top-right). Defaults to
   *  `false` (full classroom view with blackboard). */
  thumbnailMode?: boolean;
}

export function ClassroomFront(demo: ClassroomFrontDemoProps = {}) {
  const enabled = isClassroomFrontEnabled();
  const period = useStageStore((s) => s.classroom.period);
  const lessonLabel = useStageStore((s) => s.classroom.lessonLabel);
  const thumbnailMode = demo.thumbnailMode === true;

  if (!enabled) return null;
  if (period !== 'lesson') return null;

  return (
    <div
      className={styles.classroom}
      data-testid="classroom-front"
      data-thumbnail-mode={thumbnailMode ? 'true' : 'false'}
    >
      <WhisperLine />
      {thumbnailMode ? null : (
        <FrontBlackboard
          lessonLabel={lessonLabel}
          slides={demo.slides}
          currentSlide={demo.currentSlide}
          onSlideChange={demo.onSlideChange}
          autoCycle={demo.autoCycle}
          autoCycleMs={demo.autoCycleMs}
          onAutoCycleToggle={demo.onAutoCycleToggle}
        />
      )}
      <TeacherStage
        bubbleContent={demo.teacherBubbleContent}
        compact={thumbnailMode}
      />
      <Desks
        deskBubbleContents={demo.deskBubbleContents}
        deskDisplayNames={demo.deskDisplayNames}
        deskHandRaised={demo.deskHandRaised}
        activeCallOnAgentId={demo.activeCallOnAgentId}
      />
    </div>
  );
}
