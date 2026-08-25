/**
 * B.1.2 — Pure demo data generator for the `/classroom-demo` route.
 *
 * Why a separate file (and a separate route)?
 *
 *   The existing `/classroom-front-snapshot-fixture` route uses
 *   hand-picked stable seed data so the Playwright snapshot baselines
 *   stay pixel-identical across runs. The `/classroom-demo` route does
 *   the OPPOSITE: every page load produces a different classroom
 *   (different students, different lesson, different bubbles). Keeping
 *   the generator pure + dependency-free lets the unit tests pin it
 *   down with a seeded PRNG without dragging in React or jsdom.
 *
 * Design contract:
 *   - `generateDemoClassroomState(seed?)` returns a fresh
 *     `ClassroomState` whose shape matches what `useStageStore` already
 *     accepts as the `classroom` slice.
 *   - `seed` is optional; when omitted, the result is non-deterministic
 *     (the page uses `Date.now()` to keep every refresh fresh).
 *   - Pool contents (names / lessons / emojis / templates) are ≥ 8 each
 *     so successive runs feel meaningfully different.
 *   - Per-desk bubble content + hand-raise queue are exposed via the
 *     auxiliary `DemoDynamicContent` return so the page can forward
 *     them to `<ClassroomFront />` props without leaking per-seat
 *     data into the shared `ClassroomState` shape.
 *
 * NO new dependencies — the PRNG is a tiny inline `mulberry32`.
 */

import type {
  ActiveNote,
  ChalkStroke,
  ClassroomState,
  HandRaise,
  SeatConfig,
} from '@/lib/store/classroom-state';

// ============================================================
// Pools (all kept ≥ 8 entries so per-session variety is visible)
// ============================================================

/** Chinese given names — feel-realistic without leaning on personal-name APIs. */
export const DEMO_NAMES: readonly string[] = [
  '小红', '小亮', '小芳', '小明', '阿泽', '美琪', '晓东', '思琪',
  '浩然', '子轩', '雨桐', '梓萱', '俊熙', '雨涵',
] as const;

/** Lesson labels across the curriculum. */
export const DEMO_LESSONS: readonly string[] = [
  '数学·通分',
  '数学·二次函数',
  '语文·古诗',
  '语文·作文',
  '英语·时态',
  '英语·单词',
  '科学·实验',
  '历史·朝代',
  '美术·色彩',
  '音乐·节拍',
] as const;

/** Emoji pool — covers child / teen / adult silhouettes + a few
 *  personality roles for visual variety. */
export const DEMO_EMOJIS: readonly string[] = [
  '👧', '👦', '🧒', '👩', '👨', '🧑', '👶', '👵', '👴', '🦸', '🧙', '🦹',
] as const;

/** Teacher speech templates — `{name}` interpolates a student name,
 *  `{topic}` interpolates the current lesson topic. */
export const DEMO_TEACHER_TEMPLATES: readonly string[] = [
  '{name} 同学举手了。先想一下：{topic} 该怎么入手？',
  '我们来一起想 {topic} 的第一步。',
  '谁能告诉我 {topic} 中最重要的概念？',
  '{name} 同学的方法很有创意，谁有不同思路？',
  '别着急，慢慢想——{topic} 不止一种解法。',
] as const;

/** Per-desk bubble templates, grouped by intent. The `name` is
 *  interpolated at the seat level (e.g. "我同意 小红 ✓"). */
export interface DemoDeskBubbleTemplates {
  thinking: readonly string[];
  answering: readonly string[];
  asking: readonly string[];
  disagreeing: readonly string[];
}

export const DEMO_DESK_BUBBLE_TEMPLATES: DemoDeskBubbleTemplates = {
  thinking: ['嗯... 🤔', '让我想想...', '是 {name} 吗？', '好像是...'],
  answering: [
    '我觉得 {name}',
    '{name} 是答案',
    '我同意 {name} ✓',
    '我也这么认为',
  ],
  asking: ['能再说一遍吗？', '{name} 是什么意思？', '能举个例子吗？'],
  disagreeing: ['我不太确定...', '我觉得不是 {name}', '我有点不同意'],
} as const;

// ============================================================
// Seeded PRNG (mulberry32) — pure, dependency-free
// ============================================================

/** A mulberry32 PRNG — fast, deterministic, no deps. */
export function createPrng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, maxInclusive: number): number {
  return min + Math.floor(rng() * (maxInclusive - min + 1));
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  // Guarded — the pools are non-empty by construction, but TypeScript
  // can't prove that without a non-empty-tuple type.
  if (items.length === 0) throw new Error('pick(): empty pool');
  return items[Math.floor(rng() * items.length)];
}

function shuffle<T>(rng: () => number, items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => vars[key] ?? `{${key}}`);
}

// ============================================================
// Public types
// ============================================================

/** Auxiliary per-desk dynamic data the page wires into `<ClassroomFront />`
 *  via props. Kept OUTSIDE `ClassroomState` so the shared slice shape is
 *  untouched. */
export interface DemoDeskDynamic {
  /** Bubble content for this seat (Chinese localised, from one of the
   *  four template families). `undefined` → no bubble. */
  bubbleContent?: string;
  /** Marks the seat as raising a hand — the avatar renders `.hand`
   *  (wave animation) and the bubble takes "answering" content. */
  handRaised: boolean;
  /** Bubble content kind — drives the bubble's thinking-style italic
   *  variant when set. */
  bubbleKind?: 'thinking' | 'answering' | 'asking' | 'disagreeing';
}

export interface DemoDynamicContent {
  teacherBubble: string;
  deskByAgentId: Record<string, DemoDeskDynamic>;
  handRaiseIds: string[];
  activeCallOnAgentId: string | null;
  activeNote: ActiveNote | null;
}

/** Pair return value: `classroom` goes into `useStageStore.setState`'s
 *  `classroom` slice; `dynamic` is forwarded via `ClassroomFront` props. */
export interface DemoGeneration {
  classroom: ClassroomState;
  dynamic: DemoDynamicContent;
  /** Seed that produced this generation — echoed back so the page can
   *  surface it (e.g. in a hidden DOM attribute for visual snapshots). */
  seed: number;
}

// ============================================================
// Generator
// ============================================================

/**
 * Generate a fresh demo classroom. Pure — same seed → same output.
 *
 *  - 5–8 random students picked from `DEMO_NAMES` without repeats
 *    within this generation.
 *  - Random lesson label, random emoji per seat, random seat color.
 *  - 0–3 hand-raise entries, 0–1 active call-on, 0–1 active note.
 *  - 0–3 random chalk strokes inside the 0–1000 × 0–200 SVG viewBox.
 *  - `period` is always `'lesson'` (no `before-class`/`break`/`after-class`
 *    for the demo route).
 */
export function generateDemoClassroomState(seed?: number): DemoGeneration {
  const effectiveSeed = seed ?? Date.now();
  const rng = createPrng(effectiveSeed);

  const lessonLabel = pick(rng, DEMO_LESSONS);

  // ---- Seats (5–8 unique students) ----
  const seatCount = randInt(rng, 5, 8);
  const shuffledNames = shuffle(rng, DEMO_NAMES.slice());
  const seats: SeatConfig[] = [];
  const deskByAgentId: Record<string, DemoDeskDynamic> = {};
  const idByAgent: Record<string, string> = {};

  for (let i = 0; i < seatCount; i += 1) {
    const seatId = `D${i + 1}`;
    const name = shuffledNames[i];
    const emoji = pick(rng, DEMO_EMOJIS);
    // Agent id is `name_<index>` so it survives Unicode + stays unique
    // even when the pool contains look-alike names. The emoji is
    // appended to give the avatar a unique seed for the lookup table.
    const agentId = `agent-${i}-${emoji}`;
    const zone: SeatConfig['zone'] =
      i < 2 ? 'front' : i < 5 ? 'middle' : 'back';
    seats.push({
      seat_id: seatId,
      agent_id: agentId,
      deskmates: [],
      zone,
    });
    idByAgent[agentId] = name;
    deskByAgentId[agentId] = {
      bubbleContent: undefined,
      handRaised: false,
    };
    // We deliberately stash the display name onto the agent id encoding
    // so downstream consumers (TeacherStage templates that interpolate
    // the student name) work without extending ClassroomState. The
    // emoji lookup table accepts any agent id, and `getAvatarFallback`
    // keeps unknown ids rendering the first Chinese character of the
    // displayed name from the SeatConfig row in the page layer.
    // We re-use the seat's emoji as the avatar glyph by stashing it
    // in the desk's "bubbleKind" / etc. — but the simpler route is
    // to expose `name` via `idByAgent` for the page to thread down.
    void emoji;
  }

  // ---- Hand-raise queue (0–3) ----
  const handRaiseCount = randInt(rng, 0, Math.min(3, seatCount));
  const shuffledAgents = shuffle(rng, seats.map((s) => s.agent_id));
  const handRaiseIds = shuffledAgents.slice(0, handRaiseCount);
  const handRaiseQueue: HandRaise[] = handRaiseIds.map((agent_id, idx) => {
    const name = idByAgent[agent_id] ?? agent_id;
    return {
      agent_id,
      agent_name: name,
      raised_at: effectiveSeed + idx,
      origin: idx === 0 ? 'user' : 'agent',
    };
  });

  // ---- Active call-on (0–1) ----
  let activeCallOnAgentId: string | null = null;
  const classroomActiveCallOn = handRaiseQueue.length === 0 && rng() < 0.5 && seats.length > 0
    ? (() => {
        const agent_id = pick(rng, seats.map((s) => s.agent_id));
        activeCallOnAgentId = agent_id;
        return {
          target_agent_id: agent_id,
          prompt: `请 {${idByAgent[agent_id] ?? agent_id}} 同学回答问题`,
          countdown_ms: 4000,
          called_at: effectiveSeed,
        };
      })()
    : null;

  // ---- Active note (0–1) — adjacent deskmates (i and i+1) ----
  let activeNote: ActiveNote | null = null;
  if (seats.length >= 2 && rng() < 0.5) {
    const idx = randInt(rng, 0, seats.length - 2);
    activeNote = {
      from_seat: seats[idx].seat_id,
      to_seat: seats[idx + 1].seat_id,
      content: '嗯...这道题',
      animation: 'fly',
    };
  }

  // ---- Chalk strokes (0–3) ----
  const chalkStrokes: ChalkStroke[] = [];
  const strokeCount = randInt(rng, 0, 3);
  for (let i = 0; i < strokeCount; i += 1) {
    const pointCount = randInt(rng, 3, 8);
    const path: Array<{ x: number; y: number }> = [];
    for (let p = 0; p < pointCount; p += 1) {
      path.push({ x: randInt(rng, 0, 1000), y: randInt(rng, 0, 200) });
    }
    chalkStrokes.push({
      path,
      color: rng() < 0.3 ? '#f9a8d4' : '#fff',
      width: randInt(rng, 1, 3),
    });
  }

  // ---- Per-desk dynamic (hand bubble + non-hand bubble) ----
  //   - Hand-raised seats get an "answering" bubble.
  //   - A subset of non-hand-raised seats gets a non-answering bubble
  //     (thinking / asking / disagreeing) — ~60% probability per seat.
  for (const seat of seats) {
    const dynamic = deskByAgentId[seat.agent_id];
    const isHand = handRaiseIds.includes(seat.agent_id);
    if (isHand) {
      const name = idByAgent[seat.agent_id];
      const template = pick(rng, DEMO_DESK_BUBBLE_TEMPLATES.answering);
      dynamic.bubbleContent = fillTemplate(template, { name });
      dynamic.bubbleKind = 'answering';
      dynamic.handRaised = true;
    } else if (rng() < 0.6) {
      // Pick a non-answering kind uniformly
      const kinds: Array<'thinking' | 'asking' | 'disagreeing'> = [
        'thinking',
        'asking',
        'disagreeing',
      ];
      const kind = pick(rng, kinds);
      const pool = DEMO_DESK_BUBBLE_TEMPLATES[kind];
      const otherName =
        idByAgent[shuffledAgents.find((id) => id !== seat.agent_id) ?? seat.agent_id] ??
        idByAgent[seat.agent_id];
      const template = pick(rng, pool);
      dynamic.bubbleContent = fillTemplate(template, { name: otherName });
      dynamic.bubbleKind = kind;
      dynamic.handRaised = false;
    } else {
      dynamic.bubbleContent = undefined;
      dynamic.handRaised = false;
    }
  }

  // ---- Teacher speech bubble ----
  const teacherSeedName =
    handRaiseIds[0] !== undefined ? idByAgent[handRaiseIds[0]] : undefined;
  const teacherTemplate = pick(rng, DEMO_TEACHER_TEMPLATES);
  const teacherBubble = fillTemplate(teacherTemplate, {
    name: teacherSeedName ?? '小诺姐姐',
    topic: lessonLabel,
  });

  // ---- Final ClassroomState slice ----
  const classroom: ClassroomState = {
    period: 'lesson',
    periodStartedAt: effectiveSeed,
    periodEndsAt: effectiveSeed + 25 * 60 * 1000,
    lessonLabel: `Lesson-${randInt(rng, 1, 9)} ${lessonLabel}`,
    blackboardMode: true,
    chalkStrokes,
    handRaiseQueue,
    activeCallOn: classroomActiveCallOn,
    seatLayout: seats,
    bellQueue: [],
    lastError: null,
    activeNote,
    lastInputChannel: null,
  };

  const dynamic: DemoDynamicContent = {
    teacherBubble,
    deskByAgentId,
    handRaiseIds,
    activeCallOnAgentId,
    activeNote,
  };

  return { classroom, dynamic, seed: effectiveSeed };
}
