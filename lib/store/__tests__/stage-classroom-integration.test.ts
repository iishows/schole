import { describe, it, expect, beforeEach } from 'vitest';
import { useStageStore } from '../stage';
import { initialClassroomState } from '../classroom-state';

describe('stage store classroom slice (Task 3 wiring)', () => {
  beforeEach(() => {
    // Each test starts from a fresh classroom slice so order is independent
    // of any earlier mutation. resetClassroom was added to StageState in
    // Task 3 — the optional chain is defensive for the pre-implementation
    // TDD red phase but a no-op now that the slice is wired up.
    useStageStore.getState().resetClassroom?.();
  });

  it('starts with initial classroom state', () => {
    // The slice's initial value MUST equal `initialClassroomState()` —
    // tests in classroom-state.test.ts assert the same shape, so any drift
    // between the reducer's default and what the store seeds here would
    // silently break downstream UI components that read classroom.*.
    const s = useStageStore.getState();
    expect(s.classroom).toEqual(initialClassroomState());
  });

  it('dispatchClassroomAction routes the action through classroomReducer and updates the slice', () => {
    // period_start is the canonical "before-class → lesson" transition;
    // verifying it on the wired slice proves both the dispatch glue
    // (set closure) and the reducer's behaviour at the store boundary.
    useStageStore.getState().dispatchClassroomAction({
      type: 'period_start',
      id: 'p1',
      period: 'Lesson-1',
      duration: 60,
      agenda: ['导入'],
      agent_id: 't',
      timestamp: Date.now(),
    });
    expect(useStageStore.getState().classroom.period).toBe('lesson');
  });

  it('exposes classroom via the auto-generated createSelectors per-field hook', () => {
    // createSelectors derives `useStageStore.use.<key>` from the store's
    // current state shape, so adding `classroom` to StageState must surface
    // as `useStageStore.use.classroom` without any bespoke selector code.
    // The hook itself only fires inside a React render, so in a non-React
    // test we verify the wiring by asserting the function exists and the
    // synchronous read path returns the seeded slice. UI components read
    // it via `useStageStore(s => s.classroom)` (and the React-only form
    // `useStageStore.use.classroom()`); both paths share the same state.
    expect(typeof useStageStore.use.classroom).toBe('function');
    expect(useStageStore.getState().classroom).toEqual(initialClassroomState());
    expect(useStageStore.getState().classroom.period).toBe('before-class');
  });
});
