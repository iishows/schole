// @vitest-environment jsdom
// Test environment note (mirrors Task 6 deviation in period-bar.test.tsx):
//   `@testing-library/react` is not a project dependency and the Task 7
//   "DO NOT" list prohibits adding new deps, so we drive the component via
//   `react-dom/client.createRoot` + `act()` (already in `react-dom`) instead
//   of `render()` + `screen.getBy*`. Data-testid queries are written against
//   `container.innerHTML` / `container.querySelector(...)` directly.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { HandRaiseButton } from '../hand-raise-button';
import { useStageStore } from '@/lib/store/stage';
import { isClassroomShellEnabled } from '@/lib/config/feature-flags';

// React's `act()` helper needs this global flag to silence the
// "not configured to support act(...)" warning under vitest.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Plan Step 1 calls for vi.mock of feature-flags; this matches Task 5's
// engine-classroom test pattern. Use vi.mock instead of mutating
// process.env so the HandRaiseButton reads `true` from the inline
// `isClassroomShellEnabled()` call.
vi.mock('@/lib/config/feature-flags', () => ({ isClassroomShellEnabled: () => true }));

describe('HandRaiseButton', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useStageStore.getState().resetClassroom?.();
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

  it('renders floating button when enabled', async () => {
    await act(async () => {
      root.render(<HandRaiseButton />);
    });
    // Equivalent of plan's `screen.getByTestId('hand-raise-btn')`.
    expect(container.querySelector('[data-testid="hand-raise-btn"]')).not.toBeNull();
    expect(isClassroomShellEnabled()).toBe(true);
  });

  it('clicking the bell + submit dispatches raise_hand with origin=user', async () => {
    await act(async () => {
      root.render(<HandRaiseButton />);
    });
    const btn = container.querySelector('[data-testid="hand-raise-btn"]') as HTMLButtonElement | null;
    expect(btn).not.toBeNull();
    // Bell click opens the input popover (per HandRaiseButton.tsx behavior).
    await act(async () => {
      btn!.click();
    });
    const submit = container.querySelector('[data-testid="hand-raise-submit"]') as HTMLButtonElement | null;
    expect(submit).not.toBeNull();
    // Submit dispatches the raise_hand action into the classroom store.
    await act(async () => {
      submit!.click();
    });
    const q = useStageStore.getState().classroom.handRaiseQueue;
    expect(q).toHaveLength(1);
    expect(q[0].origin).toBe('user');
  });

  it('shows queue badge with count', async () => {
    useStageStore.setState((s) => ({
      ...s,
      classroom: {
        ...s.classroom,
        handRaiseQueue: [
          { agent_id: 'a1', agent_name: '小红', raised_at: Date.now(), origin: 'agent' },
          { agent_id: 'a2', agent_name: '小蓝', raised_at: Date.now(), origin: 'agent' },
        ],
      },
    }));
    await act(async () => {
      root.render(<HandRaiseButton />);
    });
    // Equivalent of plan's `screen.getByTestId('hand-raise-badge').toHaveTextContent('2')`.
    const badge = container.querySelector('[data-testid="hand-raise-badge"]') as HTMLElement | null;
    expect(badge?.textContent).toBe('2');
  });
});