// @vitest-environment jsdom
//
// Component tests for the B.1.3 full 3-pane demo shell.
//
// We mirror the same low-dependency testing approach used in
// `classroom-front.test.tsx`:
//   - no `@testing-library/react` (Global Constraint 17 bans new deps),
//   - render via `react-dom/client.createRoot` + `act()`,
//   - query the DOM through `container.querySelector(...)` against the
//     `data-testid` hooks the components expose.
//
// We seed the stage store before each render so `<ClassroomFront />`
// (which reads `useStageStore` for `period`) actually mounts; the demo
// route bypasses the persistence layer the same way (the B.1.2 page
// does `useStageStore.setState({ classroom })` in a `useEffect`).

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { DemoShell, TopHeader, ChatHistory, AssignmentPanel, InputBar } from '../index';
import type { DemoChatMessage, DemoMistake, DemoProblem } from '@/lib/classroom/demo-data-generator';
import { useStageStore } from '@/lib/store/stage';
import * as featureFlags from '@/lib/config/feature-flags';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function makeProblem(overrides: Partial<DemoProblem> = {}): DemoProblem {
  return {
    badge: '第 3 题',
    difficulty: '⭐⭐',
    code: '4-NF-A-2',
    text: '1/2 + 1/3 = ?',
    ...overrides,
  };
}

function makeMistake(overrides: Partial<DemoMistake> = {}): DemoMistake {
  return {
    q: '1/4 + 1/6 = ?',
    status: '✗',
    reason: '公分母错',
    ...overrides,
  };
}

function makeChat(
  overrides: Partial<DemoChatMessage> = {},
): DemoChatMessage {
  return {
    id: overrides.id ?? 'msg-0',
    role: overrides.role ?? 'teacher',
    content: overrides.content ?? '老师讲一下第一步',
    timestamp: overrides.timestamp ?? Date.now(),
    agentId: overrides.agentId,
    displayName: overrides.displayName,
  };
}

describe('DemoShell (B.1.3)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    // Default feature-flag ON; individual tests opt-out via the same
    // pattern `classroom-front.test.tsx` uses.
    vi.spyOn(featureFlags, 'isClassroomFrontEnabled').mockReturnValue(true);
    useStageStore.getState().resetClassroom?.();
    useStageStore.setState((s) => ({
      ...s,
      classroom: {
        ...s.classroom,
        period: 'lesson',
        lessonLabel: 'Lesson-3 数学 · 通分',
        blackboardMode: true,
        chalkStrokes: [],
        seatLayout: [
          { seat_id: 'D1', agent_id: 'agent-0-👧', deskmates: [], zone: 'front' },
          { seat_id: 'D2', agent_id: 'agent-1-👦', deskmates: [], zone: 'front' },
        ],
      },
    }));
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  describe('<TopHeader />', () => {
    it('renders the hamburger, teacher pill, 3 mode tabs, pomodoro, and chat toggle', async () => {
      await act(async () => {
        root.render(
          <TopHeader
            modeTabs={['✏️ 作业', '📖 复习', '💬 自由']}
            pomodoroSeconds={754}
            teacherName="小诺姐姐"
            chatBadgeCount={3}
          />,
        );
      });
      expect(container.querySelector('[data-testid="demo-top-header"]')).toBeTruthy();
      // Mode tabs (3 entries).
      expect(container.querySelectorAll('[data-testid^="demo-mode-tab-"]').length).toBe(3);
      // Pomodoro shows the formatted seconds; exposes data-seconds for assertions.
      const pomodoro = container.querySelector('[data-testid="demo-pomodoro"]');
      expect(pomodoro).toBeTruthy();
      expect(pomodoro?.getAttribute('data-seconds')).toBe('754');
      expect(pomodoro?.textContent ?? '').toContain('12:34');
      // Chat toggle + badge.
      const chatToggle = container.querySelector('[data-testid="demo-chat-toggle"]');
      expect(chatToggle).toBeTruthy();
      const badge = container.querySelector('[data-testid="demo-chat-badge"]');
      expect(badge).toBeTruthy();
      expect(badge?.getAttribute('data-count')).toBe('3');
      expect(badge?.textContent).toBe('3');
    });

    it('omits the chat badge when chatBadgeCount is 0', async () => {
      await act(async () => {
        root.render(
          <TopHeader
            modeTabs={['✏️ 作业', '📖 复习', '💬 自由']}
            pomodoroSeconds={1500}
            teacherName="小诺姐姐"
            chatBadgeCount={0}
          />,
        );
      });
      expect(container.querySelector('[data-testid="demo-chat-badge"]')).toBeNull();
    });

    it('renders the refresh button only when onRefresh is supplied', async () => {
      const handler = vi.fn();
      await act(async () => {
        root.render(<TopHeader onRefresh={handler} />);
      });
      const refresh = container.querySelector('[data-testid="demo-top-header-refresh"]');
      expect(refresh).toBeTruthy();
      // Clicking it routes to the supplied handler.
      await act(async () => {
        refresh?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('B.1.5 — renders 3 view-tabs (whiteboard / classroom / dashboard) with the right default', async () => {
      await act(async () => {
        root.render(<TopHeader />);
      });
      const tabsRoot = container.querySelector('[data-testid="demo-view-tabs"]');
      expect(tabsRoot).toBeTruthy();
      // Exactly 3 view tabs (📝 / 🏫 / 📊).
      const tabs = container.querySelectorAll('[data-testid^="demo-view-tab-"]');
      expect(tabs.length).toBe(3);
      const ids = Array.from(tabs).map((t) =>
        t.getAttribute('data-testid')?.replace('demo-view-tab-', ''),
      );
      expect(ids).toEqual(['whiteboard', 'classroom', 'dashboard']);
      // Default active tab = `dashboard` (preserves B.1.4 visual).
      const dashboardTab = container.querySelector('[data-testid="demo-view-tab-dashboard"]');
      expect(dashboardTab?.getAttribute('data-active')).toBe('true');
      expect(dashboardTab?.getAttribute('aria-selected')).toBe('true');
      const whiteboardTab = container.querySelector('[data-testid="demo-view-tab-whiteboard"]');
      expect(whiteboardTab?.getAttribute('data-active')).toBe('false');
    });

    it('B.1.5 — clicking a view-tab fires onViewChange with the right id', async () => {
      const handler = vi.fn();
      await act(async () => {
        root.render(<TopHeader view="dashboard" onViewChange={handler} />);
      });
      const whiteboardTab = container.querySelector('[data-testid="demo-view-tab-whiteboard"]')!;
      await act(async () => {
        whiteboardTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('whiteboard');

      const classroomTab = container.querySelector('[data-testid="demo-view-tab-classroom"]')!;
      await act(async () => {
        classroomTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenLastCalledWith('classroom');
    });

    it('B.1.5 — view prop switches the active tab styling', async () => {
      await act(async () => {
        root.render(<TopHeader view="whiteboard" />);
      });
      const whiteboardTab = container.querySelector('[data-testid="demo-view-tab-whiteboard"]');
      expect(whiteboardTab?.getAttribute('data-active')).toBe('true');
      const dashboardTab = container.querySelector('[data-testid="demo-view-tab-dashboard"]');
      expect(dashboardTab?.getAttribute('data-active')).toBe('false');
    });
  });

  describe('<ChatHistory />', () => {
    it('renders one bubble per message with the right role marker', async () => {
      const now = Date.now();
      const msgs: DemoChatMessage[] = [
        makeChat({ id: 'm1', role: 'teacher', content: '第一步是先想公分母', timestamp: now - 60_000 }),
        makeChat({ id: 'm2', role: 'student', content: '6 吗？', agentId: 'agent-0-👧', displayName: '小红', timestamp: now - 30_000 }),
        makeChat({ id: 'm3', role: 'user', content: '我算出来是 5/6', timestamp: now }),
      ];
      await act(async () => {
        root.render(<ChatHistory messages={msgs} />);
      });
      const bubbles = container.querySelectorAll('[data-testid="demo-chat-bubble"]');
      expect(bubbles.length).toBe(3);
      expect(bubbles[0]?.getAttribute('data-role')).toBe('teacher');
      expect(bubbles[1]?.getAttribute('data-role')).toBe('student');
      expect(bubbles[2]?.getAttribute('data-role')).toBe('user');
      // Bubble content + name labels render.
      expect(bubbles[0]?.textContent ?? '').toContain('第一步是先想公分母');
      expect(bubbles[1]?.textContent ?? '').toContain('小红');
      expect(bubbles[2]?.textContent ?? '').toContain('我算出来是 5/6');
    });

    it('returns null when the messages array is empty', async () => {
      await act(async () => {
        root.render(<ChatHistory messages={[]} />);
      });
      expect(container.querySelector('[data-testid="demo-chat-history"]')).toBeNull();
    });
  });

  describe('<AssignmentPanel />', () => {
    it('renders problem metadata + mistake list with the right counts', async () => {
      const problem = makeProblem();
      const mistakes = [
        makeMistake(),
        makeMistake({ q: '2/3 + 1/4 = ?', reason: '计算粗心' }),
        makeMistake({ q: '5/6 - 1/3 = ?', status: '⏱', reason: '待复习' }),
      ];
      await act(async () => {
        root.render(<AssignmentPanel problem={problem} mistakes={mistakes} />);
      });
      expect(container.querySelector('[data-testid="demo-problem-badge"]')?.textContent).toBe(
        '第 3 题',
      );
      expect(container.querySelector('[data-testid="demo-problem-difficulty"]')?.textContent).toContain(
        '⭐⭐',
      );
      expect(container.querySelector('[data-testid="demo-problem-code"]')?.textContent).toContain(
        '4-NF-A-2',
      );
      const mistakeItems = container.querySelectorAll('[data-testid="demo-mistake-item"]');
      expect(mistakeItems.length).toBe(3);
      const mistakeList = container.querySelector('[data-testid="demo-mistake-list"]');
      expect(mistakeList?.getAttribute('data-count')).toBe('3');
    });
  });

  describe('<InputBar />', () => {
    it('renders 📷, text input, 🎤, 😊, ✋ in that order', async () => {
      await act(async () => {
        root.render(<InputBar />);
      });
      const camera = container.querySelector('[data-testid="demo-input-camera"]');
      const text = container.querySelector('[data-testid="demo-input-text"]');
      const mic = container.querySelector('[data-testid="demo-input-mic"]');
      const emoji = container.querySelector('[data-testid="demo-input-emoji"]');
      const hand = container.querySelector('[data-testid="demo-input-hand"]');
      expect(camera).toBeTruthy();
      expect(text).toBeTruthy();
      expect(mic).toBeTruthy();
      expect(emoji).toBeTruthy();
      expect(hand).toBeTruthy();
      // Default state is disabled (visual-only demo, no LLM calls).
      expect((text as HTMLInputElement | null)?.disabled).toBe(true);
      expect(camera?.getAttribute('disabled')).not.toBeNull();
      // Bar exposes the disabled state via a DOM attribute so e2e
      // selectors can pin it.
      expect(container.querySelector('[data-testid="demo-input-bar"]')?.getAttribute('data-disabled')).toBe('true');
    });
  });

  describe('<DemoShell /> (integration)', () => {
    it('renders the full shell — header / chat / assignment / input — when the feature flag is on', async () => {
      const problem = makeProblem();
      const messages: DemoChatMessage[] = [
        makeChat({ id: 'a', role: 'teacher', content: '一起想一想', timestamp: Date.now() - 30_000 }),
        makeChat({ id: 'b', role: 'student', content: '好的', agentId: 'agent-0-👧', displayName: '小红', timestamp: Date.now() }),
      ];
      await act(async () => {
        root.render(
          <DemoShell
            chatHistory={messages}
            problem={problem}
            mistakes={[makeMistake(), makeMistake({ q: '5/6 - 1/3 = ?' })]}
            modeTabs={['✏️ 作业', '📖 复习', '💬 自由']}
            pomodoroSeconds={900}
            teacherName="小诺姐姐"
            chatBadgeCount={2}
          />,
        );
      });
      // Top-level shell container.
      expect(container.querySelector('[data-testid="demo-shell"]')).toBeTruthy();
      // Header + chat + assignment + input bar all in correct positions.
      expect(container.querySelector('[data-testid="demo-top-header"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="demo-chat-history"]')).toBeTruthy();
      // ClassroomFront inside (data-testid is on the inner component, not the shell).
      expect(container.querySelector('[data-testid="classroom-front"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="demo-assignment-panel"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="demo-problem-card"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="demo-input-bar"]')).toBeTruthy();

      // B.1.4 — chat must live in the right column (below the assignment
      // panel), NOT in the classroom area (left column). Verified by
      // walking the DOM tree: the chat root's ancestor chain must
      // include [data-testid="demo-right-column"] and must NOT include
      // [data-testid="demo-classroom-front-wrap"].
      const chatEl = container.querySelector('[data-testid="demo-chat-history"]')!;
      const rightCol = container.querySelector('[data-testid="demo-right-column"]')!;
      const classroomFrontWrap = container.querySelector('[data-testid="demo-classroom-front-wrap"]')!;
      expect(rightCol.contains(chatEl)).toBe(true);
      expect(classroomFrontWrap.contains(chatEl)).toBe(false);

      // Assignment area sits above the chat area inside the right column.
      const assignmentArea = container.querySelector('[data-testid="demo-assignment-area"]')!;
      const chatArea = container.querySelector('[data-testid="demo-chat-area"]')!;
      expect(rightCol.contains(assignmentArea)).toBe(true);
      expect(rightCol.contains(chatArea)).toBe(true);

      // TopHeader above main split above input bar — verified via
      // document order (children of the shell root).
      const shell = container.querySelector('[data-testid="demo-shell"]')!;
      const order = Array.from(shell.children).map((c) =>
        (c as HTMLElement).getAttribute('data-testid'),
      );
      expect(order[0]).toBe('demo-top-header');
      expect(order[order.length - 1]).toBe('demo-input-bar');
    });

    it('does not render <AssignmentPanel /> when `problem` is omitted', async () => {
      await act(async () => {
        root.render(
          <DemoShell
            modeTabs={['✏️ 作业', '📖 复习', '💬 自由']}
            pomodoroSeconds={1500}
            teacherName="小诺姐姐"
            chatBadgeCount={0}
          />,
        );
      });
      const panel = container.querySelector('[data-testid="demo-assignment-panel"]');
      expect(panel).toBeTruthy();
      expect(panel?.getAttribute('data-empty')).toBe('true');
      expect(container.querySelector('[data-testid="demo-problem-card"]')).toBeNull();
    });

    it('B.1.4 — <ChatHistory /> renders with the right column area testid and max-height exposed', async () => {
      const messages: DemoChatMessage[] = [
        makeChat({ id: 'c', role: 'teacher', content: '举手回答', timestamp: Date.now() }),
      ];
      await act(async () => {
        root.render(
          <DemoShell
            chatHistory={messages}
            problem={makeProblem()}
            mistakes={[makeMistake()]}
          />,
        );
      });
      const chat = container.querySelector('[data-testid="demo-chat-history"]');
      expect(chat).toBeTruthy();
      // The right column wraps both the assignment + chat panes.
      const rightCol = container.querySelector('[data-testid="demo-right-column"]');
      expect(rightCol).toBeTruthy();
      expect(rightCol?.contains(chat)).toBe(true);
      // Chat area wrapper exposes data-has-chat for layout assertions.
      const chatArea = container.querySelector('[data-testid="demo-chat-area"]');
      expect(chatArea?.getAttribute('data-has-chat')).toBe('true');
      // Chat root exposes the configured max-height via data attribute
      // (B.1.4 — chat-history.tsx `maxHeight` default 100%).
      expect(chat?.getAttribute('data-max-height')).toBe('100%');
    });

    it('B.1.5 — defaults to the `dashboard` view (preserves B.1.4 visual)', async () => {
      await act(async () => {
        root.render(
          <DemoShell
            slides={[
              { title: 's0', step: '① 1 / 2', chalkStrokes: [] },
              { title: 's1', step: '② 2 / 2', chalkStrokes: [] },
            ]}
          />,
        );
      });
      const shell = container.querySelector('[data-testid="demo-shell"]');
      expect(shell?.getAttribute('data-view')).toBe('dashboard');
      // Dashboard view renders the assignment panel + classroom front.
      expect(container.querySelector('[data-testid="demo-right-column"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="classroom-front"]')).toBeTruthy();
      // The whiteboard-only view is NOT rendered.
      expect(container.querySelector('[data-testid="whiteboard-fullscreen-view"]')).toBeNull();
    });

    it('B.1.5 — `view="whiteboard"` renders the whiteboard-fullscreen view only', async () => {
      await act(async () => {
        root.render(
          <DemoShell
            view="whiteboard"
            slides={[
              { title: 's0', step: '① 1 / 2', chalkStrokes: [] },
              { title: 's1', step: '② 2 / 2', chalkStrokes: [] },
            ]}
          />,
        );
      });
      expect(container.querySelector('[data-testid="whiteboard-fullscreen-view"]')).toBeTruthy();
      // The blackboard still renders inside the whiteboard-only view.
      expect(container.querySelector('[data-testid="front-blackboard"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="front-blackboard-slide-tabs"]')).toBeTruthy();
      // Desks / teacher / chat / assignment are NOT rendered.
      expect(container.querySelector('[data-testid="front-desks"]')).toBeNull();
      expect(container.querySelector('[data-testid="teacher-stage"]')).toBeNull();
      expect(container.querySelector('[data-testid="demo-right-column"]')).toBeNull();
      expect(container.querySelector('[data-testid="demo-chat-history"]')).toBeNull();
      expect(container.querySelector('[data-testid="demo-assignment-panel"]')).toBeNull();
    });

    it('B.1.6 — `view="classroom"` renders the desks + compact teacher thumbnail (no big blackboard, no slide tabs, no right column)', async () => {
      await act(async () => {
        root.render(
          <DemoShell
            view="classroom"
            chatHistory={[makeChat({ id: 'c1', content: 'hi' })]}
            problem={makeProblem()}
            mistakes={[makeMistake()]}
            slides={[
              { title: 's0', step: '① 1 / 2', chalkStrokes: [] },
              { title: 's1', step: '② 2 / 2', chalkStrokes: [] },
            ]}
          />,
        );
      });
      // The ClassroomFront wrapper is present (it's the canvas), but
      // it is in thumbnailMode so the big blackboard is gone.
      const front = container.querySelector('[data-testid="classroom-front"]')!;
      expect(front).toBeTruthy();
      expect(front.getAttribute('data-thumbnail-mode')).toBe('true');
      // The classroom view uses its own wrapper testid so the desks +
      // thumbnail stage own the whole canvas.
      expect(container.querySelector('[data-testid="demo-classroom-thumbnail-stage"]')).toBeTruthy();
      // B.1.6 — no big blackboard and therefore no slide tabs.
      expect(container.querySelector('[data-testid="front-blackboard"]')).toBeNull();
      expect(
        container.querySelector('[data-testid^="front-blackboard-slide-tab-"]'),
      ).toBeNull();
      expect(container.querySelector('[data-testid="front-blackboard-slide-tabs"]')).toBeNull();
      // The teacher stage is rendered in compact mode (small thumbnail
      // in the top-right area) instead of the full podium+bubble layout.
      const teacherStage = container.querySelector('[data-testid="teacher-stage"]')!;
      expect(teacherStage).toBeTruthy();
      expect(teacherStage.getAttribute('data-compact')).toBe('true');
      // The compact variant omits the teacher's speech bubble but keeps
      // the avatar + podium + name label.
      expect(container.querySelector('[data-testid="teacher-bubble"]')).toBeNull();
      const teacherAvatar = container.querySelector('[data-testid="teacher-avatar"]')!;
      expect(teacherAvatar).toBeTruthy();
      expect(teacherAvatar.getAttribute('data-compact')).toBe('true');
      expect(container.querySelector('[data-testid="teacher-thumbnail-name"]')).toBeTruthy();
      // Desks still render normally — the student area is the focus of
      // this view.
      expect(container.querySelector('[data-testid="front-desks"]')).toBeTruthy();
      // Right column + assignment + chat are NOT rendered in the
      // "classroom" view (they live in the dashboard tab).
      expect(container.querySelector('[data-testid="demo-right-column"]')).toBeNull();
      expect(container.querySelector('[data-testid="demo-chat-history"]')).toBeNull();
      expect(container.querySelector('[data-testid="demo-assignment-panel"]')).toBeNull();
    });

    it('B.1.6 — `view="dashboard"` renders the full blackboard (with slide tabs) + desks + teacher stage', async () => {
      await act(async () => {
        root.render(
          <DemoShell
            view="dashboard"
            slides={[
              { title: 's0', step: '① 1 / 2', chalkStrokes: [] },
              { title: 's1', step: '② 2 / 2', chalkStrokes: [] },
              { title: 's2', step: '③ 3 / 2', chalkStrokes: [] },
            ]}
          />,
        );
      });
      const front = container.querySelector('[data-testid="classroom-front"]')!;
      expect(front).toBeTruthy();
      expect(front.getAttribute('data-thumbnail-mode')).toBe('false');
      // Dashboard keeps the full blackboard + slide tabs.
      expect(container.querySelector('[data-testid="front-blackboard"]')).toBeTruthy();
      const tabs = container.querySelectorAll('[data-testid^="front-blackboard-slide-tab-"]');
      expect(tabs.length).toBe(3);
      // Teacher stage is the full-size layout (with speech bubble).
      const teacherStage = container.querySelector('[data-testid="teacher-stage"]')!;
      expect(teacherStage).toBeTruthy();
      expect(teacherStage.getAttribute('data-compact')).toBe('false');
      expect(container.querySelector('[data-testid="teacher-bubble"]')).toBeTruthy();
    });

    it('B.1.6 — `view="whiteboard"` keeps the slide tabs (full blackboard, no desks, no teacher stage)', async () => {
      await act(async () => {
        root.render(
          <DemoShell
            view="whiteboard"
            slides={[
              { title: 's0', step: '① 1 / 2', chalkStrokes: [] },
              { title: 's1', step: '② 2 / 2', chalkStrokes: [] },
            ]}
          />,
        );
      });
      expect(container.querySelector('[data-testid="whiteboard-fullscreen-view"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="front-blackboard"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="front-blackboard-slide-tabs"]')).toBeTruthy();
      // Teacher stage + desks are NOT rendered in the whiteboard view.
      expect(container.querySelector('[data-testid="teacher-stage"]')).toBeNull();
      expect(container.querySelector('[data-testid="front-desks"]')).toBeNull();
    });

    it('B.1.5 — clicking a view-tab in <TopHeader /> switches the rendered content', async () => {
      await act(async () => {
        root.render(<DemoShell />);
      });
      // Start in dashboard.
      expect(container.querySelector('[data-testid="demo-shell"]')?.getAttribute('data-view')).toBe(
        'dashboard',
      );
      // Click the whiteboard tab.
      const whiteboardTab = container.querySelector('[data-testid="demo-view-tab-whiteboard"]')!;
      await act(async () => {
        whiteboardTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(container.querySelector('[data-testid="demo-shell"]')?.getAttribute('data-view')).toBe(
        'whiteboard',
      );
      expect(container.querySelector('[data-testid="whiteboard-fullscreen-view"]')).toBeTruthy();
      // Click the classroom tab.
      const classroomTab = container.querySelector('[data-testid="demo-view-tab-classroom"]')!;
      await act(async () => {
        classroomTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(container.querySelector('[data-testid="demo-shell"]')?.getAttribute('data-view')).toBe(
        'classroom',
      );
      expect(container.querySelector('[data-testid="whiteboard-fullscreen-view"]')).toBeNull();
      expect(container.querySelector('[data-testid="classroom-front"]')).toBeTruthy();
    });

    it('B.1.5 — slide state persists across view changes (when switching from whiteboard → classroom → dashboard)', async () => {
      const slides = [
        { title: 's0', step: '① 1 / 3', chalkStrokes: [] },
        { title: 's1', step: '② 2 / 3', chalkStrokes: [] },
        { title: 's2', step: '③ 3 / 3', chalkStrokes: [] },
      ];
      await act(async () => {
        root.render(<DemoShell slides={slides} initialSlide={0} />);
      });
      // Initially on dashboard, slide 0.
      const wrap = container.querySelector('[data-testid="demo-classroom-front-wrap"]')!;
      expect(wrap.getAttribute('data-current-slide')).toBe('0');

      // Switch to whiteboard (active tab click).
      await act(async () => {
        container
          .querySelector('[data-testid="demo-view-tab-whiteboard"]')!
          .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      const whiteboard = container.querySelector('[data-testid="whiteboard-fullscreen-view"]')!;
      expect(whiteboard.getAttribute('data-current-slide')).toBe('0');

      // Click slide-tab-2 (the third slide) inside the whiteboard.
      await act(async () => {
        container
          .querySelector('[data-testid="front-blackboard-slide-tab-2"]')!
          .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(
        container.querySelector('[data-testid="whiteboard-fullscreen-view"]')!.getAttribute(
          'data-current-slide',
        ),
      ).toBe('2');

      // Switch to dashboard — the active slide must still be 2.
      await act(async () => {
        container
          .querySelector('[data-testid="demo-view-tab-dashboard"]')!
          .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      const wrapAfter = container.querySelector('[data-testid="demo-classroom-front-wrap"]')!;
      expect(wrapAfter.getAttribute('data-current-slide')).toBe('2');

      // Switch to classroom — still slide 2.
      await act(async () => {
        container
          .querySelector('[data-testid="demo-view-tab-classroom"]')!
          .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      // B.1.6 — the classroom view uses the thumbnail-stage wrapper
      // (the big blackboard is gone in this view), but it still
      // exposes `data-current-slide` so the lifted slide state is
      // observable in tests / e2e selectors.
      const classroomWrap = container.querySelector('[data-testid="demo-classroom-thumbnail-stage"]')!;
      expect(classroomWrap.getAttribute('data-current-slide')).toBe('2');
    });

    it('B.1.5 — `view` prop is fully controlled (parent state wins over internal state)', async () => {
      await act(async () => {
        root.render(<DemoShell view="whiteboard" />);
      });
      expect(container.querySelector('[data-testid="demo-shell"]')?.getAttribute('data-view')).toBe(
        'whiteboard',
      );
      // Click a different tab — the parent doesn't update `view`, so
      // the shell stays on whiteboard.
      await act(async () => {
        container
          .querySelector('[data-testid="demo-view-tab-classroom"]')!
          .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(container.querySelector('[data-testid="demo-shell"]')?.getAttribute('data-view')).toBe(
        'whiteboard',
      );
    });
  });
});
