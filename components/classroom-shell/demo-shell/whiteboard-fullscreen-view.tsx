'use client';

/**
 * B.1.5 — WhiteboardFullscreenView.
 *
 * A trimmed render that fills the available area with JUST the
 * blackboard + slide tabs + auto-cycle toggle. No desks, no teacher
 * stage, no whisper line, no assignment panel, no chat — the user
 * is "looking at the board" instead of "sitting inside the
 * classroom".
 *
 * The slide state (`currentSlide` + `autoCycle`) is owned by
 * `<DemoShell />` so it persists across view changes — switching
 * from `whiteboard` to `classroom` and back keeps the same slide
 * active, and the auto-cycle timer keeps running uninterrupted.
 *
 * Visual:
 *
 *   ┌────────────────────────────────────────────┐
 *   │  (this view fills the `<main>` area 100%)  │
 *   │  ┌──────────────────────────────────────┐  │
 *   │  │  [1] [2] [3] [4] [5]   ⏸ 暂停         │  │
 *   │  │                                      │  │
 *   │  │  Lesson-3 数学·通分                  │  │
 *   │  │  ① 学习中                            │  │
 *   │  │                                      │  │
 *   │  │  <chalk strokes scaled to fill>      │  │
 *   │  │                                      │  │
 *   │  └──────────────────────────────────────┘  │
 *   └────────────────────────────────────────────┘
 *
 * The blackboard is the same `<FrontBlackboard />` used in B.1.4,
 * so the slide switcher + auto-cycle behaviour stay identical.
 * We just stretch its container so the SVG chalk layer scales to
 * fill the space.
 */

import { FrontBlackboard } from '@/components/classroom-shell/front/blackboard';
import type { DemoSlide } from '@/lib/classroom/demo-data-generator';
import { useStageStore } from '@/lib/store/stage';
import styles from './demo-shell.module.css';

export interface WhiteboardFullscreenViewProps {
  /** Slide deck — same shape as `<DemoShell />` forwards to
   *  `<FrontBlackboard />`. */
  slides?: DemoSlide[];
  /** Index of the currently active slide (lifted from
   *  `<DemoShell />`). */
  currentSlide: number;
  /** Fired when the user clicks a slide tab. */
  onSlideChange(idx: number): void;
  /** When true, advance to the next slide every `autoCycleMs` ms. */
  autoCycle: boolean;
  /** Auto-cycle interval in ms. Defaults to 8000. */
  autoCycleMs?: number;
  /** Fired when the user clicks the auto-cycle toggle button. */
  onAutoCycleToggle(): void;
}

export function WhiteboardFullscreenView({
  slides,
  currentSlide,
  onSlideChange,
  autoCycle,
  autoCycleMs = 8000,
  onAutoCycleToggle,
}: WhiteboardFullscreenViewProps) {
  // Read lessonLabel from the store so the board title stays in
  // sync with whatever the parent generation seeded.
  const lessonLabel = useStageStore((s) => s.classroom.lessonLabel);

  return (
    <div
      className={styles.whiteboardView}
      data-testid="whiteboard-fullscreen-view"
      data-current-slide={Array.isArray(slides) && slides.length > 0 ? currentSlide : -1}
    >
      <FrontBlackboard
        lessonLabel={lessonLabel}
        slides={slides}
        currentSlide={currentSlide}
        onSlideChange={onSlideChange}
        autoCycle={autoCycle}
        autoCycleMs={autoCycleMs}
        onAutoCycleToggle={onAutoCycleToggle}
      />
    </div>
  );
}
