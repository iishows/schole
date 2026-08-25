import { describe, it, expect } from 'vitest';
import { ClassroomLayoutService } from '../classroom-layout-service';
import type { SeatConfig } from '@/lib/store/classroom-state';
import type { HandRaise } from '@/lib/store/classroom-state';

describe('ClassroomLayoutService.resolveSortKey (L1)', () => {
  it('returns zone priority (front=0 < middle=1 < back=2)', () => {
    const layout: SeatConfig[] = [
      { seat_id: 'A1', agent_id: 'a', deskmates: [], zone: 'front' },
      { seat_id: 'C1', agent_id: 'c', deskmates: [], zone: 'back' },
      { seat_id: 'B1', agent_id: 'b', deskmates: [], zone: 'middle' },
    ];
    const ka = ClassroomLayoutService.resolveSortKey(layout, 'a');
    const kb = ClassroomLayoutService.resolveSortKey(layout, 'b');
    const kc = ClassroomLayoutService.resolveSortKey(layout, 'c');
    expect(ka).toBeLessThan(kb);
    expect(kb).toBeLessThan(kc);
  });

  it('uses seatIndex as tie-breaker within same zone', () => {
    const layout: SeatConfig[] = [
      { seat_id: 'A2', agent_id: 'a2', deskmates: [], zone: 'front' },
      { seat_id: 'A1', agent_id: 'a1', deskmates: [], zone: 'front' },
    ];
    const k1 = ClassroomLayoutService.resolveSortKey(layout, 'a1');
    const k2 = ClassroomLayoutService.resolveSortKey(layout, 'a2');
    expect(k1).toBeLessThan(k2);
  });

  it('returns Infinity for unknown agent (defensive)', () => {
    expect(ClassroomLayoutService.resolveSortKey([], 'ghost')).toBe(Infinity);
  });
});

describe('ClassroomLayoutService.sortHandQueue (L1)', () => {
  it('orders raises by [zone, seatIndex, raised_at] front-to-back', () => {
    const layout: SeatConfig[] = [
      { seat_id: 'A1', agent_id: 'back-agent', deskmates: [], zone: 'back' },
      { seat_id: 'B1', agent_id: 'mid-agent', deskmates: [], zone: 'middle' },
      { seat_id: 'C1', agent_id: 'front-agent', deskmates: [], zone: 'front' },
    ];
    const raises: HandRaise[] = [
      { agent_id: 'back-agent', agent_name: 'B', raised_at: 1, origin: 'agent' },
      { agent_id: 'mid-agent', agent_name: 'M', raised_at: 2, origin: 'agent' },
      { agent_id: 'front-agent', agent_name: 'F', raised_at: 3, origin: 'agent' },
    ];
    const sorted = ClassroomLayoutService.sortHandQueue(raises, layout);
    expect(sorted.map(r => r.agent_id)).toEqual(['front-agent', 'mid-agent', 'back-agent']);
  });

  it('breaks ties on raised_at when sort key is equal (same seat/zone)', () => {
    const layout: SeatConfig[] = [
      { seat_id: 'A1', agent_id: 'a1', deskmates: [], zone: 'front' },
      { seat_id: 'A2', agent_id: 'a2', deskmates: [], zone: 'front' },
    ];
    const raises: HandRaise[] = [
      { agent_id: 'a2', agent_name: 'A2', raised_at: 200, origin: 'agent' },
      { agent_id: 'a1', agent_name: 'A1', raised_at: 100, origin: 'agent' },
    ];
    const sorted = ClassroomLayoutService.sortHandQueue(raises, layout);
    expect(sorted.map(r => r.agent_id)).toEqual(['a1', 'a2']);
  });

  it('does not mutate input array', () => {
    const layout: SeatConfig[] = [
      { seat_id: 'A1', agent_id: 'a', deskmates: [], zone: 'front' },
    ];
    const raises: HandRaise[] = [
      { agent_id: 'a', agent_name: 'A', raised_at: 1, origin: 'agent' },
    ];
    const original = [...raises];
    ClassroomLayoutService.sortHandQueue(raises, layout);
    expect(raises).toEqual(original);
  });
});