// @vitest-environment jsdom
// Test environment note (mirrors call-on-card.test.tsx and the audit "DO NOT"
// list prohibits adding new deps, so we drive the component via
// `react-dom/client.createRoot` + `act()` instead of `render()` + `screen.getBy*`).
// Data-testid queries are written against `container.querySelector(...)` directly.
// ChatArea pulls in useChatSessions / SessionList / LectureNotesView /
// CallOnCard which all open external stores — mock them out so this test
// focuses on the L3 input priority mutex at the ChatArea UI layer.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { ChatArea } from '../chat-area';
import { useStageStore } from '@/lib/store/stage';

// React's `act()` helper needs this global flag to silence the
// "not configured to support act(...)" warning under vitest.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/lib/config/feature-flags', () => ({ isClassroomShellEnabled: () => true }));

// Mock i18n: ChatArea calls useI18n() which requires an I18nProvider
// context. Provide a passthrough so the rendered tree resolves without
// dragging the real provider / message catalog into the unit test.
vi.mock('@/lib/hooks/use-i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    locale: 'zh-CN',
    setLocale: () => undefined,
    availableLocales: ['zh-CN', 'en-US'],
  }),
}));

// Mock useChatSessions so ChatArea doesn't try to create real sessions.
vi.mock('../use-chat-sessions', () => ({
  useChatSessions: () => ({
    sessions: [],
    activeSessionType: null,
    expandedSessionIds: new Set<string>(),
    isStreaming: false,
    createSession: vi.fn(),
    endSession: vi.fn(),
    endActiveSession: vi.fn(),
    continueSoftClosingSession: vi.fn(),
    confirmSoftClosingSession: vi.fn(),
    softPauseActiveSession: vi.fn(),
    resumeActiveSession: vi.fn(),
    sendMessage: vi.fn(),
    startDiscussion: vi.fn(),
    startLecture: vi.fn(),
    addLectureMessage: vi.fn(),
    toggleSessionExpand: vi.fn(),
    getLectureMessageId: vi.fn(),
    pauseBuffer: vi.fn(),
    resumeBuffer: vi.fn(),
    pauseActiveLiveBuffer: vi.fn(),
    resumeActiveLiveBuffer: vi.fn(),
  }),
  MANUAL_STOP_END_OPTIONS: { source: 'manual_stop' as const },
}));

// Mock the heavy child components so we only see the L3 input priority UI.
vi.mock('../session-list', () => ({
  SessionList: () => <div data-testid="mock-session-list" />,
}));
vi.mock('../lecture-notes-view', () => ({
  LectureNotesView: () => <div data-testid="mock-lecture-notes" />,
}));
vi.mock('@/components/classroom-shell/call-on-card', () => ({
  CallOnCard: () => <div data-testid="call-on-card" />,
}));

type ClassroomSlice = {
  lastInputChannel: 'text' | 'voice' | 'raise_hand' | null;
};

function setClassroomSlice(patch: Partial<ClassroomSlice>): void {
  useStageStore.setState((s) => ({
    classroom: { ...s.classroom, ...patch },
  } as any));
}

describe('ChatArea L3 input priority mutex', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    // Reset the classroom slice to a known baseline so each test starts
    // from `lastInputChannel: null`.
    setClassroomSlice({ lastInputChannel: null });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  async function renderChatAreaOnChatTab(): Promise<void> {
    await act(async () => {
      root.render(<ChatArea />);
    });
    // The chat tab is the second TabsTrigger — activate it so the
    // priority input panel (which only renders inside the chat
    // TabsContent; Radix Tabs.Content unmounts when its tab is
    // inactive) is mounted. Radix renders Tabs.Trigger with
    // `id="radix-…-trigger-<value>"` so we target the chat trigger by
    // id-suffix.
    //
    // Note: in jsdom `chatTab.click()` is a no-op for Radix Tabs
    // (the onValueChange handler does not fire under the synthetic
    // event) but keyboard activation (Enter) works because Radix's
    // keyboard handler is invoked on the focused element. We dispatch
    // a real KeyboardEvent so the test path matches the keyboard
    // activation Radix ships with.
    const chatTab = container.querySelector<HTMLElement>('[id$="trigger-chat"]');
    if (chatTab) {
      await act(async () => {
        chatTab.focus();
        chatTab.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
        );
      });
    }
  }

  it('blocks the mic button while text is the active input channel', async () => {
    setClassroomSlice({ lastInputChannel: 'text' });
    await renderChatAreaOnChatTab();

    const micButton = container.querySelector<HTMLButtonElement>('[data-testid="mic-button"]');
    expect(micButton).not.toBeNull();
    // L3 mutex: while text is active the mic must be disabled so the
    // user finishes typing before voice starts. Also check the data
    // attribute the audit asked for so observers / tests can drive the
    // disabled-tooltip affordance without parsing the className.
    expect(micButton?.disabled).toBe(true);
    expect(micButton?.dataset.blocked).toBe('true');

    // Even if the click handler somehow fires (e.g. event bubbled),
    // the store must still read `text` because the handler returns
    // early when lastInputChannel === 'text'.
    await act(async () => {
      micButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const after = useStageStore.getState().classroom.lastInputChannel;
    expect(after).toBe('text');
  });

  it('allows the mic button when lastInputChannel is null', async () => {
    setClassroomSlice({ lastInputChannel: null });
    await renderChatAreaOnChatTab();

    const micButton = container.querySelector<HTMLButtonElement>('[data-testid="mic-button"]');
    expect(micButton).not.toBeNull();
    expect(micButton?.disabled).toBe(false);
    expect(micButton?.dataset.blocked).toBe('false');

    await act(async () => {
      micButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    // After a successful click the channel must flip to 'voice' so
    // subsequent handlers can observe the active channel.
    expect(useStageStore.getState().classroom.lastInputChannel).toBe('voice');
  });

  it('allows the mic button when lastInputChannel is already voice', async () => {
    setClassroomSlice({ lastInputChannel: 'voice' });
    await renderChatAreaOnChatTab();

    const micButton = container.querySelector<HTMLButtonElement>('[data-testid="mic-button"]');
    expect(micButton).not.toBeNull();
    expect(micButton?.disabled).toBe(false);

    // Click again — still allowed and the channel stays voice (no-op
    // for the dispatcher, but the button is not blocked).
    await act(async () => {
      micButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(useStageStore.getState().classroom.lastInputChannel).toBe('voice');
  });

  it('text submit claims the text channel and blocks the mic', async () => {
    setClassroomSlice({ lastInputChannel: null });
    await renderChatAreaOnChatTab();

    const input = container.querySelector<HTMLInputElement>('[data-testid="priority-text-input"]');
    const submit = container.querySelector<HTMLButtonElement>('[data-testid="priority-text-submit"]');
    const micButton = container.querySelector<HTMLButtonElement>('[data-testid="mic-button"]');
    expect(input).not.toBeNull();
    expect(submit).not.toBeNull();
    expect(micButton).not.toBeNull();

    // Type into the input + click submit.
    await act(async () => {
      // simulate user typing
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set;
      setter?.call(input, 'hello');
      input?.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      submit?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // After submit, lastInputChannel must be 'text' and mic must be disabled.
    expect(useStageStore.getState().classroom.lastInputChannel).toBe('text');
    expect(micButton?.disabled).toBe(true);
    expect(micButton?.dataset.blocked).toBe('true');
  });
});