'use client';

/**
 * Front-view blackboard (整面投影). Reads `blackboardMode` + the
 * active slide's chalk strokes from props (B.1.4) and reuses the V1
 * `buildChalkSvg` helper to render the chalk stroke buffer.
 *
 * B.1.4 — added slide tabs + auto-cycle. The component accepts:
 *   - `slides?: DemoSlide[]`        — when supplied, renders N tab
 *     buttons above the board. Click → fires `onSlideChange(idx)`.
 *   - `currentSlide?: number`       — index of the active tab.
 *   - `onSlideChange?: (idx)`       — fired when the user clicks a
 *     tab. Parent owns the state.
 *   - `autoCycle?: boolean`         — when true, advances
 *     `currentSlide` every `autoCycleMs` ms (6–10 s recommended).
 *   - `autoCycleMs?: number`        — interval in ms (default 8000).
 *
 * The auto-cycle is implemented as a `useEffect` that registers a
 * `setInterval` and clears it on unmount / when paused / when
 * `slides` changes. When paused, the user can click tabs to switch
 * manually. When `autoCycle` flips on, the timer resets from
 * `currentSlide` so the user does not see an unexpected jump.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useStageStore } from '@/lib/store/stage';
import { buildChalkSvg } from '@/lib/utils/chalk-stroke-svg';
import type { ChalkStroke } from '@/lib/utils/chalk-stroke-svg';
import type { DemoSlide } from '@/lib/classroom/demo-data-generator';
import styles from './classroom-front.module.css';

export interface FrontBlackboardProps {
  lessonLabel: string;
  /** B.1.4 — optional slide deck; when present, slide tabs render. */
  slides?: DemoSlide[];
  /** Index of the currently active slide. */
  currentSlide?: number;
  /** Fired when the user clicks a slide tab. */
  onSlideChange?: (idx: number) => void;
  /** When true, advance to the next slide every `autoCycleMs` ms. */
  autoCycle?: boolean;
  /** Auto-cycle interval in ms. Defaults to 8000 (8 s). */
  autoCycleMs?: number;
  /** Fired when the user clicks the auto-cycle toggle button. */
  onAutoCycleToggle?: () => void;
}

export function FrontBlackboard({
  lessonLabel,
  slides,
  currentSlide,
  onSlideChange,
  autoCycle = false,
  autoCycleMs = 8000,
  onAutoCycleToggle,
}: FrontBlackboardProps) {
  const blackboardMode = useStageStore((s) => s.classroom.blackboardMode);
  const storeStrokes = useStageStore((s) => (s.classroom.chalkStrokes ?? []) as ChalkStroke[]);

  // ---- Slide tabs (B.1.4) ----
  const hasSlides = Array.isArray(slides) && slides.length > 0;
  const safeIndex = hasSlides
    ? Math.max(0, Math.min(currentSlide ?? 0, slides.length - 1))
    : 0;
  const activeSlide = hasSlides ? slides[safeIndex] : undefined;

  // Per-slide chalk strokes win over the store-level strokes so the
  // blackboard visibly changes when the slide switches.
  const strokes: ChalkStroke[] = activeSlide?.chalkStrokes ?? storeStrokes;
  // When slides are present, render the active slide's step. Otherwise
  // fall back to the B.1 baseline "① 学习中" so the snapshot fixture
  // (which never supplies slides) keeps its text baseline.
  const stepText = hasSlides
    ? activeSlide?.step ?? '① 学习中'
    : '① 学习中';
  const boardTitle = hasSlides ? activeSlide?.title ?? lessonLabel : lessonLabel || '本节课';

  // ---- Auto-cycle (B.1.4) ----
  // The interval callback must read the *latest* safeIndex each tick so
  // a tick landing between two parent re-renders does not regress to
  // the previous index. Use a ref mirror updated every render.
  const safeIndexRef = useRef(safeIndex);
  const slidesLengthRef = useRef(slides?.length ?? 0);
  const onSlideChangeRef = useRef(onSlideChange);
  safeIndexRef.current = safeIndex;
  slidesLengthRef.current = slides?.length ?? 0;
  onSlideChangeRef.current = onSlideChange;

  const goNext = useCallback(() => {
    const cb = onSlideChangeRef.current;
    const len = slidesLengthRef.current;
    if (!cb || len <= 0) return;
    const next = (safeIndexRef.current + 1) % len;
    cb(next);
  }, []);

  useEffect(() => {
    if (!autoCycle || !hasSlides) return undefined;
    const id = setInterval(goNext, autoCycleMs);
    return () => clearInterval(id);
  }, [autoCycle, autoCycleMs, goNext, hasSlides]);

  if (!blackboardMode) return null;

  const handleTabClick = (idx: number) => {
    if (onSlideChange) onSlideChange(idx);
  };

  const handleAutoCycleToggle = () => {
    if (onAutoCycleToggle) onAutoCycleToggle();
  };

  return (
    <div className={styles.blackboard} data-testid="front-blackboard">
      <div className={styles.blackboardHeader}>
        {hasSlides ? (
          <div
            className={styles.slideTabs}
            data-testid="front-blackboard-slide-tabs"
            role="tablist"
            aria-label="slide switcher"
          >
            {slides.map((slide, idx) => {
              const isActive = idx === safeIndex;
              return (
                <button
                  type="button"
                  key={`slide-tab-${idx}`}
                  className={`${styles.slideTab} ${isActive ? styles.slideTabActive : ''}`}
                  data-testid={`front-blackboard-slide-tab-${idx}`}
                  data-active={isActive ? 'true' : 'false'}
                  role="tab"
                  aria-selected={isActive ? 'true' : 'false'}
                  onClick={() => handleTabClick(idx)}
                  title={slide.title}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        ) : null}
        {hasSlides ? (
          <button
            type="button"
            className={`${styles.autoCycleToggle} ${autoCycle ? styles.autoCycleToggleOn : ''}`}
            data-testid="front-blackboard-auto-cycle-toggle"
            data-on={autoCycle ? 'true' : 'false'}
            onClick={handleAutoCycleToggle}
            aria-pressed={autoCycle ? 'true' : 'false'}
            title={autoCycle ? '停止自动播放' : '开始自动播放'}
          >
            {autoCycle ? '⏸ 暂停' : '▶ 自动'}
          </button>
        ) : null}
      </div>
      <span className={styles.boardStep} data-testid="front-blackboard-lesson-label">
        {boardTitle}
      </span>
      <span className={styles.boardStepActive} data-testid="front-blackboard-step">
        {stepText}
      </span>
      {activeSlide?.teacherHint ? (
        <span
          className={styles.boardHint}
          data-testid="front-blackboard-teacher-hint"
          title={activeSlide.teacherHint}
        >
          💡 {activeSlide.teacherHint}
        </span>
      ) : null}
      <svg
        className={styles.boardSvg}
        viewBox="0 0 1000 200"
        preserveAspectRatio="none"
        data-testid="front-blackboard-svg"
        data-stroke-count={strokes.length}
        data-current-slide={hasSlides ? safeIndex : -1}
      >
        <defs>
          <filter id="chalk-rough-front">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
            <feDisplacementMap in="SourceGraphic" scale="2" />
          </filter>
        </defs>
        <g dangerouslySetInnerHTML={{ __html: buildChalkSvg(strokes) }} />
      </svg>
    </div>
  );
}
