import { describe, it, expect } from 'vitest';
import { ClassroomLayoutService } from '../classroom-layout-service';

describe('ClassroomLayoutService.autoGenerate', () => {
  it('assigns agents to seats A1.. in order', () => {
    const layout = ClassroomLayoutService.autoGenerate(
      ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'],
      ['teacher', 'a1', 'a2', 'a3', 'a4', 'a5']
    );
    expect(layout[0].seat_id).toBe('A1');
    expect(layout[0].agent_id).toBe('teacher');
    expect(layout[5].seat_id).toBe('B3');
  });

  it('marks adjacent seats as deskmates', () => {
    const layout = ClassroomLayoutService.autoGenerate(
      ['A1', 'A2', 'A3'], ['a1', 'a2', 'a3']
    );
    expect(layout[0].deskmates).toContain('a2');
    expect(layout[1].deskmates.sort()).toEqual(['a1', 'a3']);
  });

  it('zone=front for first row, middle for middle row, back for last', () => {
    const layout = ClassroomLayoutService.autoGenerate(
      ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      ['a1', 'a2', 'a3', 'a4', 'a5', 'a6']
    );
    expect(layout[0].zone).toBe('front');
    expect(layout[2].zone).toBe('middle');
    expect(layout[4].zone).toBe('back');
  });

  it('overrideSeat replaces single seat config', () => {
    const layout = ClassroomLayoutService.autoGenerate(
      ['A1', 'A2', 'A3'], ['a1', 'a2', 'a3']
    );
    const overridden = ClassroomLayoutService.overrideSeat(layout, 'A2', {
      seat_id: 'A2', agent_id: 'a2', deskmates: ['a1'], zone: 'front',
    });
    expect(overridden[1].deskmates).toEqual(['a1']);
  });
});
