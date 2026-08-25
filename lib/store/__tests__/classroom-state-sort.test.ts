import { describe, it, expect } from 'vitest';
import { classroomReducer, initialClassroomState } from '../classroom-state';
import { ClassroomLayoutService } from '@/lib/services/classroom-layout-service';
import type { SeatConfig } from '../classroom-state';

const now = 1_700_000_000_000;

function withSeatLayout(seatLayout: SeatConfig[]) {
  return { ...initialClassroomState(), seatLayout };
}

describe('classroomReducer raise_hand sort (L1)', () => {
  it('sorts 3 agents in mixed zones front→back after raise_hand', () => {
    const seatLayout: SeatConfig[] = [
      { seat_id: 'C1', agent_id: 'back-agent', deskmates: [], zone: 'back' },
      { seat_id: 'B1', agent_id: 'mid-agent', deskmates: [], zone: 'middle' },
      { seat_id: 'A1', agent_id: 'front-agent', deskmates: [], zone: 'front' },
    ];
    let s = withSeatLayout(seatLayout);
    // Append in reverse zone order to verify sort (not just append order).
    s = classroomReducer(s, {
      type: 'raise_hand', id: 'r1', agent_id: 'back-agent', agent_name: 'B',
      raised_at: now, origin: 'agent',
    });
    s = classroomReducer(s, {
      type: 'raise_hand', id: 'r2', agent_id: 'mid-agent', agent_name: 'M',
      raised_at: now + 1, origin: 'agent',
    });
    s = classroomReducer(s, {
      type: 'raise_hand', id: 'r3', agent_id: 'front-agent', agent_name: 'F',
      raised_at: now + 2, origin: 'agent',
    });
    expect(s.handRaiseQueue.map(h => h.agent_id)).toEqual([
      'front-agent', 'mid-agent', 'back-agent',
    ]);
  });

  it('single agent raise_hand is unchanged (no-op on already-sorted queue)', () => {
    const seatLayout: SeatConfig[] = [
      { seat_id: 'A1', agent_id: 'a1', deskmates: [], zone: 'front' },
    ];
    let s = withSeatLayout(seatLayout);
    s = classroomReducer(s, {
      type: 'raise_hand', id: 'r1', agent_id: 'a1', agent_name: 'A',
      raised_at: now, origin: 'agent',
    });
    expect(s.handRaiseQueue.map(h => h.agent_id)).toEqual(['a1']);
  });
});

// Sanity: sortHandQueue itself is exported from ClassroomLayoutService.
describe('ClassroomLayoutService.sortHandQueue export (L1 contract)', () => {
  it('exports sortHandQueue as a callable function', () => {
    expect(typeof ClassroomLayoutService.sortHandQueue).toBe('function');
    expect(typeof ClassroomLayoutService.resolveSortKey).toBe('function');
  });
});