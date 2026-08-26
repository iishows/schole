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
  });
});
