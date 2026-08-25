import { describe, it, expect } from 'vitest';
import { classroomReducer, initialClassroomState } from '../classroom-state';

const now = 1_700_000_000_000;

describe('classroomReducer', () => {
  it('initializes in before-class', () => {
    const s = initialClassroomState();
    expect(s.period).toBe('before-class');
    expect(s.handRaiseQueue).toEqual([]);
    expect(s.activeCallOn).toBeNull();
  });

  it('transitions before-class → lesson on period_start', () => {
    const s = classroomReducer(initialClassroomState(), {
      type: 'period_start', id: 'p', period: 'Lesson-1', duration: 2700,
      agenda: ['导入'], agent_id: 't', timestamp: now,
    });
    expect(s.period).toBe('lesson');
    expect(s.periodStartedAt).toBe(now);
    expect(s.periodEndsAt).toBe(now + 2700_000);
    expect(s.lessonLabel).toBe('Lesson-1');
  });

  it('transitions lesson → break on period_end', () => {
    const a = classroomReducer(initialClassroomState(), {
      type: 'period_start', id: 'p', period: 'L', duration: 60,
      agenda: ['x'], agent_id: 't', timestamp: now,
    });
    const b = classroomReducer(a, {
      type: 'period_end', id: 'e', break_duration: 600,
      agent_id: 't', timestamp: now + 60_000,
    });
    expect(b.period).toBe('break');
  });

  it('transitions lesson → after-class when period_end.is_last_lesson=true', () => {
    let s = classroomReducer(initialClassroomState(), {
      type: 'period_start', id: 'p', period: 'L', duration: 60,
      agenda: ['x'], agent_id: 't', timestamp: now,
    });
    s = classroomReducer(s, {
      type: 'period_end', id: 'e', break_duration: 600, is_last_lesson: true,
      agent_id: 't', timestamp: now + 60_000,
    });
    expect(s.period).toBe('after-class');
  });

  it('appends raise_hand to FIFO queue with raised_at', () => {
    let s = classroomReducer(initialClassroomState(), {
      type: 'raise_hand', id: 'r', agent_id: 'a1', agent_name: '小红',
      raised_at: now, origin: 'agent',
    });
    s = classroomReducer(s, {
      type: 'raise_hand', id: 'r2', agent_id: 'a2', agent_name: '小蓝',
      raised_at: now + 1, origin: 'agent',
    });
    expect(s.handRaiseQueue.map(h => h.agent_id)).toEqual(['a1', 'a2']);
  });

  it('replaces activeCallOn on call_on (独占)', () => {
    let s = classroomReducer(initialClassroomState(), {
      type: 'call_on', id: 'c', target_agent_id: 'a1', prompt: 'q',
      agent_id: 't', timestamp: now,
    });
    expect(s.activeCallOn?.target_agent_id).toBe('a1');
    s = classroomReducer(s, {
      type: 'call_on', id: 'c2', target_agent_id: 'a2', prompt: 'q2',
      agent_id: 't', timestamp: now + 1,
    });
    expect(s.activeCallOn?.target_agent_id).toBe('a2');
  });

  it('clears handRaiseQueue on call_on', () => {
    let s = classroomReducer(initialClassroomState(), {
      type: 'raise_hand', id: 'r', agent_id: 'a1', agent_name: '小红',
      raised_at: now, origin: 'agent',
    });
    s = classroomReducer(s, {
      type: 'call_on', id: 'c', target_agent_id: 'a1', prompt: 'q',
      agent_id: 't', timestamp: now + 1,
    });
    expect(s.handRaiseQueue).toEqual([]);
  });

  it('toggles blackboardMode on blackboard_annotate', () => {
    let s = initialClassroomState();
    expect(s.blackboardMode).toBe(false);
    s = classroomReducer(s, {
      type: 'blackboard_annotate', id: 'b', layer: 'blackboard',
      path: [{ x: 0, y: 0 }], duration: 1000,
      agent_id: 't', timestamp: now,
    });
    expect(s.blackboardMode).toBe(true);
  });

  it('illegal transition (period_end from before-class) keeps state + flags error', () => {
    const s = classroomReducer(initialClassroomState(), {
      type: 'period_end', id: 'e', break_duration: 600,
      agent_id: 't', timestamp: now,
    });
    expect(s.period).toBe('before-class');
    expect(s.lastError).toMatch(/illegal transition/i);
  });
});
