'use client';

/**
 * B.1.4 — Full 3-pane demo shell (restructured).
 *
 * Container layout:
 *
 *   ┌─────────────────────────────────────────────────────┐
 *   │  <TopHeader />          56px                        │
 *   ├─────────────────────────────────────────────────────┤
 *   │  <ClassroomFront />     |  <AssignmentPanel />      │
 *   │  (full height,          |  <ChatHistory />          │
 *   │   no chat strip)        |  (380 px, vertical split) │
 *   │                         |                           │
 *   ├─────────────────────────────────────────────────────┤
 *   │  <InputBar />           64px                        │
 *   └─────────────────────────────────────────────────────┘
 *
 * B.1.4 changes vs B.1.3:
 *   - Chat history was a 140 px strip above the blackboard; it now
 *     lives in the right-hand column under `<AssignmentPanel />` and
 *     fills the bottom half of that 380 px column with internal scroll.
 *   - The blackboard hosts a slide switcher (tabs + auto-cycle toggle)
 *     wired through `<DemoShell />`'s internal slide state.
 *   - Slide state resets to the generator's `currentSlide` whenever
 *     the page refreshes the generation (`onRefresh` re-key).
 *
 * Data flow:
 *   - `courseware.slides[]` + `courseware.currentSlide` come from the
 *     generator (seed-stable). On mount `DemoShell` seeds
 *     `useState(currentSlide)` from this and runs an auto-cycle
 *     `useEffect` (8 s default) that advances the active tab.
 *   - `useEffect` clears the interval on unmount and when the user
 *     pauses via the toggle button.
 *   - `onRefresh()` from the parent resets both `currentSlide` and
 *     `autoCycle` so the next generation starts paused on its own slide.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClassroomFront } from '@/components/classroom-shell/front';
import type {
  DemoChatMessage,
  DemoMistake,
  DemoProblem,
  DemoSlide,
} from '@/lib/classroom/demo-data-generator';
import { TopHeader } from './top-header';
import { ChatHistory } from './chat-history';
import { AssignmentPanel } from './assignment-panel';
import { InputBar } from './input-bar';
import styles from './demo-shell.module.css';

export interface DemoShellProps {
  // Forwarded to <ClassroomFront /> (B.1.2 demo props)
  teacherBubbleContent?: string;
  deskBubbleContents?: Record<string, string>;
  deskDisplayNames?: Record<string, string>;
  deskHandRaised?: Record<string, boolean>;
  activeCallOnAgentId?: string | null;

  // B.1.3 new payloads
  chatHistory?: DemoChatMessage[];
  problem?: DemoProblem;
  mistakes?: DemoMistake[];
  modeTabs?: string[];
  pomodoroSeconds?: number;
  teacherName?: string;
  chatBadgeCount?: number;

  // B.1.4 — slide deck forwarded to <FrontBlackboard />.
  slides?: DemoSlide[];
  initialSlide?: number;
  /** Auto-cycle interval override (ms). Defaults to 8000. */
  autoCycleMs?: number;

  // Refresh affordance — when supplied, a `换一换 🎲` button appears
  // inside <TopHeader /> at the chat-toggle slot.
  onRefresh?(): void;
}

export function DemoShell(props: DemoShellProps) {
  const {
    teacherBubbleContent,
    deskBubbleContents,
    deskDisplayNames,
    deskHandRaised,
    activeCallOnAgentId,
    chatHistory = [],
    problem,
    mistakes = [],
    modeTabs,
    pomodoroSeconds,
    teacherName,
    chatBadgeCount,
    slides,
    initialSlide = 0,
    autoCycleMs = 8000,
    onRefresh,
  } = props;

  // B.1.4 — slide state lives in the shell. Reset to the generator's
  // currentSlide when the page regenerates (onRefresh bumps renderKey,
  // which the page passes through as initialSlide).
  const [currentSlide, setCurrentSlide] = useState<number>(
    Math.max(0, Math.min(initialSlide, Math.max(0, (slides?.length ?? 1) - 1))),
  );
  const [autoCycle, setAutoCycle] = useState(false);

  // When the generation changes (slides array reference flips) reset to
  // the new initial slide + pause auto-cycle so the next generation
  // starts clean.
  const slideCount = slides?.length ?? 0;
  useEffect(() => {
    setCurrentSlide(Math.max(0, Math.min(initialSlide, Math.max(0, slideCount - 1))));
    setAutoCycle(false);
  }, [slides, initialSlide, slideCount]);

  const handleSlideChange = useCallback((idx: number) => {
    if (!Number.isFinite(idx)) return;
    setCurrentSlide(idx);
  }, []);

  const handleAutoCycleToggle = useCallback(() => {
    setAutoCycle((prev) => !prev);
  }, []);

  // Stable memo for the chat area — empty array ⇒ no chat at all.
  const chatElements = useMemo(() => {
    if (!Array.isArray(chatHistory) || chatHistory.length === 0) return null;
    return <ChatHistory messages={chatHistory} />;
  }, [chatHistory]);

  return (
    <div className={styles.shell} data-testid="demo-shell">
      <TopHeader
        modeTabs={modeTabs}
        pomodoroSeconds={pomodoroSeconds}
        teacherName={teacherName}
        chatBadgeCount={chatBadgeCount}
        onRefresh={onRefresh}
      />
      <div className={styles.main}>
        <div className={styles.classroomArea}>
          <div
            className={styles.classroomFrontWrap}
            data-testid="demo-classroom-front-wrap"
            data-current-slide={slideCount > 0 ? currentSlide : -1}
          >
            <ClassroomFront
              teacherBubbleContent={teacherBubbleContent}
              deskBubbleContents={deskBubbleContents}
              deskDisplayNames={deskDisplayNames}
              deskHandRaised={deskHandRaised}
              activeCallOnAgentId={activeCallOnAgentId}
              slides={slides}
              currentSlide={currentSlide}
              onSlideChange={handleSlideChange}
              autoCycle={autoCycle}
              autoCycleMs={autoCycleMs}
              onAutoCycleToggle={handleAutoCycleToggle}
            />
          </div>
        </div>
        <div className={styles.rightColumn} data-testid="demo-right-column">
          <div className={styles.assignmentArea} data-testid="demo-assignment-area">
            {problem ? (
              <AssignmentPanel problem={problem} mistakes={mistakes} />
            ) : (
              <aside
                className={styles.assignment}
                data-testid="demo-assignment-panel"
                data-empty="true"
              />
            )}
          </div>
          <div
            className={`${styles.chatArea} ${chatElements ? '' : styles.chatAreaFull}`}
            data-testid="demo-chat-area"
            data-has-chat={chatElements ? 'true' : 'false'}
          >
            {chatElements}
          </div>
        </div>
      </div>
      <InputBar />
    </div>
  );
}
