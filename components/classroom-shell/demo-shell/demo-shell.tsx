'use client';

/**
 * B.1.3 — Full 3-pane demo shell.
 *
 * Container layout (mockup-faithful, derived from
 * `mockups/classroom-layout-c3.html`):
 *
 *   ┌─────────────────────────────────────────────────────┐
 *   │  <TopHeader />          56px                        │
 *   ├─────────────────────────────────────────────────────┤
 *   │  <ClassroomFront />     |  <AssignmentPanel />      │
 *   │  + <ChatHistory />      |  (380px)                  │
 *   │                         |                           │
 *   ├─────────────────────────────────────────────────────┤
 *   │  <InputBar />           64px                        │
 *   └─────────────────────────────────────────────────────┘
 *
 * Data flow: every prop below comes from
 * `generateDemoClassroomState()`. The page re-runs the generator on
 * each (re)mount and threads the new payload in. The component is
 * itself stateless — no internal state, no effects — so refreshing the
 * data only requires the page to bump a `key` / `renderKey`.
 *
 * Feature-flag gating — the page (`/classroom-demo`) wraps the entire
 * shell behind `isClassroomFrontEnabled()`. Inside the shell we DO NOT
 * re-gate: that would make unit tests brittle and would conflict with
 * the page's own disabled banner.
 */

import { ClassroomFront } from '@/components/classroom-shell/front';
import type { DemoChatMessage, DemoMistake, DemoProblem } from '@/lib/classroom/demo-data-generator';
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
    onRefresh,
  } = props;

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
          <ChatHistory messages={chatHistory} />
          <div className={styles.classroomFrontWrap} data-testid="demo-classroom-front-wrap">
            <ClassroomFront
              teacherBubbleContent={teacherBubbleContent}
              deskBubbleContents={deskBubbleContents}
              deskDisplayNames={deskDisplayNames}
              deskHandRaised={deskHandRaised}
              activeCallOnAgentId={activeCallOnAgentId}
            />
          </div>
        </div>
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
      <InputBar />
    </div>
  );
}
