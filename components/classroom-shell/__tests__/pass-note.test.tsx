// @vitest-environment jsdom
// Test environment note (mirrors Task 6/7 deviation in period-bar/hand-raise):
//   `@testing-library/react` is not a project dependency and Task 10's
//   "DO NOT" list prohibits adding new deps, so we drive the component via
//   `react-dom/client.createRoot` + `act()` (already in `react-dom`) instead
//   of `render()` + `screen.getBy*`. Data-testid queries are written against
//   `container.querySelector(...)` directly.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { PassNoteOverlay } from '../pass-note';
import { useStageStore } from '@/lib/store/stage';
import { ClassroomLayoutService } from '@/lib/services/classroom-layout-service';

// React's `act()` helper needs this global flag to silence the
// "not configured to support act(...)" warning under vitest.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/lib/config/feature-flags', () => ({ isClassroomShellEnabled: () => true }));

describe('PassNoteOverlay', () => {
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

  it('renders SVG when pass_note dispatched with valid adjacent seats', async () => {
    const layout = ClassroomLayoutService.autoGenerate(['A1', 'A2'], ['a1', 'a2']);
    useStageStore.setState((s) => ({
      ...s,
      classroom: {
        ...s.classroom,
        seatLayout: layout,
        activeNote: { from_seat: 'A1', to_seat: 'A2', content: 'hi', animation: 'fly' },
      },
    }));
    await act(async () => {
      root.render(<PassNoteOverlay />);
    });
    expect(container.querySelector('[data-testid="pass-note-svg"]')).not.toBeNull();
  });

  it('drops note when seats not adjacent (semantic guard)', async () => {
    const layout = ClassroomLayoutService.autoGenerate(['A1', 'B1'], ['a1', 'a2']);
    useStageStore.setState((s) => ({
      ...s,
      classroom: {
        ...s.classroom,
        seatLayout: layout,
        activeNote: { from_seat: 'A1', to_seat: 'B1', content: 'no', animation: 'fly' },
      },
    }));
    await act(async () => {
      root.render(<PassNoteOverlay />);
    });
    expect(container.querySelector('[data-testid="pass-note-svg"]')).toBeNull();
  });
});
