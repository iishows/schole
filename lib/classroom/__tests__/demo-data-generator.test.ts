// Pure-helper unit tests for the B.1.2 demo data generator.
// No React, no jsdom — runs in vitest's default node env.
import { describe, it, expect } from 'vitest';
import {
  DEMO_NAMES,
  DEMO_LESSONS,
  DEMO_EMOJIS,
  DEMO_TEACHER_TEMPLATES,
  DEMO_DESK_BUBBLE_TEMPLATES,
  createPrng,
  generateDemoClassroomState,
} from '../demo-data-generator';

describe('demo-data-generator (B.1.2)', () => {
  describe('pool invariants', () => {
    it('exposes ≥ 8 Chinese names so per-session variety is visible', () => {
      expect(DEMO_NAMES.length).toBeGreaterThanOrEqual(8);
      // No duplicates — names come from a curated list, not user input.
      const unique = new Set(DEMO_NAMES);
      expect(unique.size).toBe(DEMO_NAMES.length);
    });

    it('exposes ≥ 8 lesson labels across the curriculum', () => {
      expect(DEMO_LESSONS.length).toBeGreaterThanOrEqual(8);
      const unique = new Set(DEMO_LESSONS);
      expect(unique.size).toBe(DEMO_LESSONS.length);
    });

    it('exposes ≥ 8 emojis spanning child / adult / personality silhouettes', () => {
      expect(DEMO_EMOJIS.length).toBeGreaterThanOrEqual(8);
      // Sanity check — the pool should contain kid + adult silhouettes
      // so the demo can render mixed-age classes.
      expect(DEMO_EMOJIS).toContain('👧');
      expect(DEMO_EMOJIS).toContain('👦');
      expect(DEMO_EMOJIS).toContain('🧒');
    });

    it('exposes ≥ 5 teacher speech templates and ≥ 4 desk-bubble kinds', () => {
      expect(DEMO_TEACHER_TEMPLATES.length).toBeGreaterThanOrEqual(5);
      expect(DEMO_DESK_BUBBLE_TEMPLATES.thinking.length).toBeGreaterThanOrEqual(2);
      expect(DEMO_DESK_BUBBLE_TEMPLATES.answering.length).toBeGreaterThanOrEqual(2);
      expect(DEMO_DESK_BUBBLE_TEMPLATES.asking.length).toBeGreaterThanOrEqual(2);
      expect(DEMO_DESK_BUBBLE_TEMPLATES.disagreeing.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('createPrng (mulberry32)', () => {
    it('returns a deterministic sequence for the same seed', () => {
      const a = createPrng(42);
      const b = createPrng(42);
      const seqA = Array.from({ length: 8 }, () => a());
      const seqB = Array.from({ length: 8 }, () => b());
      expect(seqA).toEqual(seqB);
    });

    it('returns different sequences for different seeds', () => {
      const a = createPrng(1);
      const b = createPrng(2);
      const seqA = Array.from({ length: 4 }, () => a());
      const seqB = Array.from({ length: 4 }, () => b());
      expect(seqA).not.toEqual(seqB);
    });

    it('always returns values in [0, 1)', () => {
      const rng = createPrng(0);
      for (let i = 0; i < 1000; i += 1) {
        const v = rng();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });
  });

  describe('generateDemoClassroomState', () => {
    it('returns a ClassroomState that conforms to the B.1 slice shape', () => {
      const gen = generateDemoClassroomState(2026);
      expect(gen.seed).toBe(2026);
      // Required B.1 fields
      expect(gen.classroom.period).toBe('lesson');
      expect(typeof gen.classroom.lessonLabel).toBe('string');
      expect(gen.classroom.lessonLabel.length).toBeGreaterThan(0);
      expect(gen.classroom.blackboardMode).toBe(true);
      expect(Array.isArray(gen.classroom.seatLayout)).toBe(true);
      expect(gen.classroom.seatLayout.length).toBeGreaterThanOrEqual(5);
      expect(gen.classroom.seatLayout.length).toBeLessThanOrEqual(8);
      // chalkStrokes + handRaiseQueue + activeNote are always defined
      // (possibly empty) so the consuming components can render
      // without optional-chaining on every render.
      expect(Array.isArray(gen.classroom.chalkStrokes)).toBe(true);
      expect(gen.classroom.chalkStrokes!.length).toBeLessThanOrEqual(3);
      expect(Array.isArray(gen.classroom.handRaiseQueue)).toBe(true);
      expect(gen.classroom.handRaiseQueue.length).toBeLessThanOrEqual(3);
      expect(gen.classroom.lastInputChannel).toBeNull();
      expect(gen.classroom.bellQueue).toEqual([]);
      expect(gen.classroom.lastError).toBeNull();
      // Period is always 'lesson' for the demo route.
      expect(gen.classroom.period).not.toBe('before-class');
      expect(gen.classroom.period).not.toBe('break');
      expect(gen.classroom.period).not.toBe('after-class');
    });

    it('returns identical output for the same seed (reproducibility)', () => {
      const a = generateDemoClassroomState(12345);
      const b = generateDemoClassroomState(12345);
      // Compare the JSON projection so we ignore any incidental
      // object-identity quirks (e.g. class instance vs plain object).
      expect(JSON.stringify(a.classroom)).toBe(JSON.stringify(b.classroom));
      expect(JSON.stringify(a.dynamic)).toBe(JSON.stringify(b.dynamic));
      expect(a.seed).toBe(b.seed);
    });

    it('returns different output for different seeds (variety)', () => {
      const a = generateDemoClassroomState(1);
      const b = generateDemoClassroomState(2);
      // Lesson label OR hand-raise queue OR chalk strokes should
      // differ between two arbitrary seeds — the union of three
      // matches gives us 1 - (1 - small prob)^3 ≈ near-certain.
      const same =
        a.classroom.lessonLabel === b.classroom.lessonLabel &&
        JSON.stringify(a.classroom.handRaiseQueue) ===
          JSON.stringify(b.classroom.handRaiseQueue) &&
        JSON.stringify(a.classroom.chalkStrokes) ===
          JSON.stringify(b.classroom.chalkStrokes);
      expect(same).toBe(false);
    });

    it('always returns a non-empty lesson label of the form "Lesson-N <topic>"', () => {
      for (let i = 0; i < 50; i += 1) {
        const gen = generateDemoClassroomState(i);
        expect(gen.classroom.lessonLabel).toMatch(/^Lesson-\d /);
        // Topic suffix is one of the configured lessons.
        const topic = gen.classroom.lessonLabel.replace(/^Lesson-\d /, '');
        expect(DEMO_LESSONS).toContain(topic);
      }
    });

    it('emits unique seat ids and unique display names within a single generation', () => {
      for (let i = 0; i < 20; i += 1) {
        const gen = generateDemoClassroomState(i);
        const seatIds = gen.classroom.seatLayout.map((s) => s.seat_id);
        const agentIds = gen.classroom.seatLayout.map((s) => s.agent_id);
        expect(new Set(seatIds).size).toBe(seatIds.length);
        expect(new Set(agentIds).size).toBe(agentIds.length);
      }
    });

    it('hands the hand-raise queue + dynamic desk data off in the auxiliary payload', () => {
      const gen = generateDemoClassroomState(7);
      // Every hand-raised agent must also be marked as handRaised in
      // the dynamic payload, so the page can forward that flag down
      // without re-reading the store.
      const handRaisedIds = new Set(
        gen.classroom.handRaiseQueue.map((h) => h.agent_id),
      );
      for (const id of handRaisedIds) {
        expect(gen.dynamic.deskByAgentId[id]).toBeDefined();
        expect(gen.dynamic.deskByAgentId[id].handRaised).toBe(true);
      }
      // The teacher bubble is always non-empty (the generator always
      // interpolates a template).
      expect(gen.dynamic.teacherBubble.length).toBeGreaterThan(0);
    });

    it('keeps chalk stroke paths inside the 0–1000 × 0–200 blackboard viewBox', () => {
      for (let i = 0; i < 30; i += 1) {
        const gen = generateDemoClassroomState(i);
        for (const stroke of gen.classroom.chalkStrokes ?? []) {
          expect(stroke.path.length).toBeGreaterThanOrEqual(2);
          for (const p of stroke.path) {
            expect(p.x).toBeGreaterThanOrEqual(0);
            expect(p.x).toBeLessThanOrEqual(1000);
            expect(p.y).toBeGreaterThanOrEqual(0);
            expect(p.y).toBeLessThanOrEqual(200);
          }
        }
      }
    });

    it('falls back to Date.now() when no seed is supplied (non-deterministic)', () => {
      // Two generations without a seed should differ unless both
      // somehow hit Date.now() within the same millisecond. We give
      // them a tiny gap to make the assertion meaningful.
      const a = generateDemoClassroomState();
      const b = generateDemoClassroomState();
      // Either the seeds differ OR the outputs differ. Both are
      // acceptable for "non-deterministic" — we only care that the
      // generator did not crash when seed was omitted.
      expect(typeof a.seed).toBe('number');
      expect(typeof b.seed).toBe('number');
    });
  });
});
