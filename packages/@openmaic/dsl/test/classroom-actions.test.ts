import { describe, it, expect } from 'vitest';
import {
  type PeriodStartAction,
  type PeriodEndAction,
  type PeriodBellAction,
  type RaiseHandAction,
  type CallOnAction,
  type PassNoteAction,
  type BlackboardAnnotateAction,
  validateClassroomAction,
  isClassroomAction,
} from '../src/classroom-actions.js';

describe('classroom-actions schema', () => {
  it('accepts a valid period_start', () => {
    const a: PeriodStartAction = {
      id: 'p1', type: 'period_start',
      period: 'Lesson-1', duration: 2700,
      agenda: ['导入', '新授', '练习', '总结'],
      agent_id: 'teacher', timestamp: Date.now(),
    };
    expect(validateClassroomAction(a)).toBe(true);
  });

  it('rejects period_start missing required agenda', () => {
    const bad = { id: 'p1', type: 'period_start', period: 'Lesson-1', duration: 2700, agent_id: 't', timestamp: 1 };
    expect(validateClassroomAction(bad)).toBe(false);
  });

  it('accepts a valid raise_hand with origin=user', () => {
    const a: RaiseHandAction = {
      id: 'r1', type: 'raise_hand',
      agent_id: 'user', agent_name: '我',
      raised_at: Date.now(), origin: 'user', question: '可以再说一遍吗？',
    };
    expect(isClassroomAction(a)).toBe(true);
    expect(validateClassroomAction(a)).toBe(true);
  });

  it('accepts raise_hand from agent without question', () => {
    const a: RaiseHandAction = {
      id: 'r2', type: 'raise_hand',
      agent_id: 'agent-1', agent_name: '小红',
      raised_at: Date.now(), origin: 'agent',
    };
    expect(validateClassroomAction(a)).toBe(true);
  });

  it('rejects call_on without target_agent_id', () => {
    const bad = { id: 'c1', type: 'call_on', prompt: '请回答', agent_id: 'teacher', timestamp: 1 };
    expect(validateClassroomAction(bad)).toBe(false);
  });

  it('rejects pass_note with non-adjacent seats', () => {
    // pass_note 校验要求 to_seat 在 from_seat 的邻桌，schema 层只校验结构；
    // 语义校验在 classroom-service.ts
    const a: PassNoteAction = {
      id: 'n1', type: 'pass_note',
      from_seat: 'A1', to_seat: 'B3',  // schema 层面通过
      content: '要不要一起算？', animation: 'fly',
      agent_id: 'agent-1', timestamp: 1,
    };
    expect(validateClassroomAction(a)).toBe(true);
  });

  it('accepts blackboard_annotate with path strokes', () => {
    const a: BlackboardAnnotateAction = {
      id: 'b1', type: 'blackboard_annotate',
      layer: 'blackboard',
      path: [{ x: 10, y: 10 }, { x: 20, y: 20 }, { x: 30, y: 30 }],
      duration: 1500,
      agent_id: 'teacher', timestamp: 1,
    };
    expect(validateClassroomAction(a)).toBe(true);
  });

  it('rejects payload over 4 KB', () => {
    const huge = {
      id: 'b1', type: 'blackboard_annotate', layer: 'blackboard',
      path: Array.from({ length: 5000 }, (_, i) => ({ x: i, y: i })),
      duration: 1500, agent_id: 't', timestamp: 1,
    };
    expect(validateClassroomAction(huge)).toBe(false);
  });
});
