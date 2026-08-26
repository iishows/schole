'use client';

/**
 * B.1.5 — Full 3-pane demo shell (restructured + view-level tabs).
 *
 * Container layout (fullscreen — B.1.5):
 *
 *   ┌─────────────────────────────────────────────────────┐
 *   │  <TopHeader />          56px   (with view-tabs)     │
 *   ├─────────────────────────────────────────────────────┤
 *   │                                                     │
 *   │  <viewMode>  (switch-rendered by `view` state)      │
 *   │                                                     │
 *   │  · dashboard  → ClassroomFront | AssignmentPanel    │
 *   │                       + ChatHistory                │
 *   │  · classroom  → ClassroomFront only (full area)     │
 *   │  · whiteboard → WhiteboardFullscreenView only       │
 *   │                                                     │
 *   ├─────────────────────────────────────────────────────┤
 *   │  <InputBar />           64px                        │
 *   └─────────────────────────────────────────────────────┘
 *
 * B.1.5 changes vs B.1.4:
 *   - Added 3 view-level tabs in <TopHeader />: 📝 白板 / 🏫 教室 /
 *     📊 作业. Default = 'dashboard' so the existing visual is
 *     preserved when the page is freshly loaded.
 *   - The shell now switches render output based on `view`:
 *       · `whiteboard` → only the blackboard + slide switcher
 *         (new `<WhiteboardFullscreenView />`)
 *       · `classroom`  → the full `<ClassroomFront />` (blackboard +
 *         teacher + desks) without the right-hand assignment/chat
 *         column
 *       · `dashboard`  → the B.1.4 full layout (classroom left +
 *         assignment + chat right + input bar bottom)
 *   - Slide state (`currentSlide` + `autoCycle`) is now LIFTED to
 *     `<DemoShell />` and shared by both `<ClassroomFront />` (when
 *     `classroom` or `dashboard` is active) and
 *     `<WhiteboardFullscreenView />` (when `whiteboard` is active).
 *     The state persists across view changes — switching from
 *     whiteboard to classroom keeps the same active slide.
 *   - The outer wrapper (in `app/classroom-demo/page.tsx`) is now
 *     `100vw x 100vh`; the shell stretches to fill the viewport
 *     with a soft 1280-px cap so wider monitors get more room
 *     without overflow.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClassroomFront } from '@/components/classroom-shell/front';
import type {
  DemoChatMessage,
  DemoMistake,
  DemoProblem,
  DemoSlide,
} from '@/lib/classroom/demo-data-generator';
import { TopHeader, type DemoViewId } from './top-header';
import { ChatHistory } from './chat-history';
import { AssignmentPanel } from './assignment-panel';
import { InputBar } from './input-bar';
import { WhiteboardFullscreenView } from './whiteboard-fullscreen-view';
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

  // B.1.5 — controlled / uncontrolled view state. When `defaultView`
  // is supplied the shell manages its own `view` state; when `view`
  // + `onViewChange` are supplied the parent owns it. Tests use the
  // controlled form so they can assert what view gets rendered.
  view?: DemoViewId;
  defaultView?: DemoViewId;
  onViewChange?(next: DemoViewId): void;

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
    view: controlledView,
    defaultView = 'dashboard',
    onViewChange,
    onRefresh,
  } = props;

  // B.1.5 — internal view state. The shell is "controlled" when the
  // parent supplies `view` + `onViewChange`; otherwise it owns its
  // own state. Both modes coexist so the page can stay uncontrolled
  // (default `dashboard`) while the tests drive the view directly.
  const [internalView, setInternalView] = useState<DemoViewId>(defaultView);
  const isControlled = controlledView !== undefined;
  const activeView: DemoViewId = isControlled ? (controlledView as DemoViewId) : internalView;
  const handleViewChange = useCallback(
    (next: DemoViewId) => {
      if (!isControlled) setInternalView(next);
      if (onViewChange) onViewChange(next);
    },
    [isControlled, onViewChange],
  );

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

  // B.1.5 — shared render output for the `classroom` and `dashboard`
  // views. The `dashboard` view wraps the same `<ClassroomFront />`
  // with the right-hand assignment + chat column; the `classroom`
  // view drops the right column so the desks + teacher + blackboard
  // stretch to fill the whole main area.
  const renderClassroomFront = () => (
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
  );

  const renderMain = () => {
    if (activeView === 'whiteboard') {
      return (
        <div className={styles.main} data-view="whiteboard">
          <WhiteboardFullscreenView
            slides={slides}
            currentSlide={currentSlide}
            onSlideChange={handleSlideChange}
            autoCycle={autoCycle}
            autoCycleMs={autoCycleMs}
            onAutoCycleToggle={handleAutoCycleToggle}
          />
        </div>
      );
    }
    if (activeView === 'classroom') {
      return (
        <div className={styles.main} data-view="classroom">
          <div className={styles.classroomArea}>
            <div
              className={styles.classroomFrontWrap}
              data-testid="demo-classroom-front-wrap"
              data-current-slide={slideCount > 0 ? currentSlide : -1}
            >
              {renderClassroomFront()}
            </div>
          </div>
        </div>
      );
    }
    // `dashboard` — the B.1.4 full layout.
    return (
      <div className={styles.main} data-view="dashboard">
        <div className={styles.classroomArea}>
          <div
            className={styles.classroomFrontWrap}
            data-testid="demo-classroom-front-wrap"
            data-current-slide={slideCount > 0 ? currentSlide : -1}
          >
            {renderClassroomFront()}
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
    );
  };

  return (
    <div className={styles.shell} data-testid="demo-shell" data-view={activeView}>
      <TopHeader
        modeTabs={modeTabs}
        pomodoroSeconds={pomodoroSeconds}
        teacherName={teacherName}
        chatBadgeCount={chatBadgeCount}
        onRefresh={onRefresh}
        view={activeView}
        onViewChange={handleViewChange}
      />
      {renderMain()}
      <InputBar />
    </div>
  );
}
