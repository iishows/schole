// Pure-helper unit tests — no React, no jsdom environment needed.
import { describe, it, expect } from 'vitest';
import { getStudentColor, getAvatarFallback } from '../class-helpers';

describe('class-helpers (B.1)', () => {
  describe('getStudentColor', () => {
    it('cycles through the 4 colour classes by seatIndex', () => {
      expect(getStudentColor(0)).toBe('student1');
      expect(getStudentColor(1)).toBe('student2');
      expect(getStudentColor(2)).toBe('student3');
      expect(getStudentColor(3)).toBe('me');
    });

    it('wraps around once the index exceeds the colour class count', () => {
      expect(getStudentColor(4)).toBe('student1');
      expect(getStudentColor(5)).toBe('student2');
      expect(getStudentColor(7)).toBe('me');
      expect(getStudentColor(8)).toBe('student1');
    });

    it('handles negative seatIndex without throwing or returning an out-of-range class', () => {
      // Negative indices must still resolve to one of the 4 valid classes —
      // a real layout service might emit seat indices that don't start at 0.
      expect(getStudentColor(-1)).toBe('me');
      expect(getStudentColor(-4)).toBe('student1');
    });
  });

  describe('getAvatarFallback', () => {
    it('prefers the first character of the display name over the agent id', () => {
      expect(getAvatarFallback('小红', 'agent-xh')).toBe('小');
      expect(getAvatarFallback('阿泽', 'agent-zz')).toBe('阿');
    });

    it('falls back to the agent id when the display name is empty (Chinese names start with their own char)', () => {
      expect(getAvatarFallback('', 'alice')).toBe('A');
      expect(getAvatarFallback('', 'bob-2')).toBe('B');
    });

    it('returns the universal kid emoji when both name and id are empty', () => {
      expect(getAvatarFallback('', '')).toBe('🧒');
    });
  });
});
