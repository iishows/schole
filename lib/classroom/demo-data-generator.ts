/**
 * B.1.2 / B.1.3 — Pure demo data generator for the `/classroom-demo` route.
 *
 * Why a separate file (and a separate route)?
 *
 *   The existing `/classroom-front-snapshot-fixture` route uses
 *   hand-picked stable seed data so the Playwright snapshot baselines
 *   stay pixel-identical across runs. The `/classroom-demo` route does
 *   the OPPOSITE: every page load produces a different classroom
 *   (different students, different lesson, different bubbles, different
 *   homework problem, different chat history, different pomodoro
 *   timer). Keeping the generator pure + dependency-free lets the unit
 *   tests pin it down with a seeded PRNG without dragging in React or
 *   jsdom.
 *
 * Design contract:
 *   - `generateDemoClassroomState(seed?)` returns a fresh
 *     `ClassroomState` whose shape matches what `useStageStore` already
 *     accepts as the `classroom` slice, PLUS the auxiliary demo data
 *     (`chatHistory`, `courseware`, `homework`, `header`) the B.1.3
 *     full-shell layout needs.
 *   - `seed` is optional; when omitted, the result is non-deterministic
 *     (the page uses `Date.now()` to keep every refresh fresh).
 *   - Pool contents (names / lessons / emojis / templates) are ≥ 8 each
 *     so successive runs feel meaningfully different.
 *   - Per-desk bubble content + hand-raise queue are exposed via the
 *     auxiliary `DemoDynamicContent` return so the page can forward
 *     them to `<ClassroomFront />` props without leaking per-seat
 *     data into the shared `ClassroomState` shape.
 *   - B.1.3 new payloads (`chatHistory`, `courseware`, `homework`,
 *     `header`) live outside `ClassroomState` — same `DemoGeneration`
 *     return bag, just more fields.
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
// B.1.3 — Pools for the full 3-pane shell (top header + chat history
// + assignment panel + input bar). Each pool is ≥ 8 entries so
// successive refreshes feel meaningfully different.
// ============================================================

/** Chat history message templates, grouped by `role`. The chat history
 *  surfaces a vertical strip in the demo shell above the blackboard;
 *  templates use `{name}` for student interpolation (teacher role uses
 *  fixed "小诺姐姐") and `{topic}` for lesson interpolation. */
export interface DemoChatTemplates {
  teacher: readonly string[];
  student: readonly string[];
}

export const DEMO_CHAT_TEMPLATES: DemoChatTemplates = {
  // Explanation / encouragement / hint / praise / redirect — all
  // authored in teacher voice ("小诺姐姐 + ...").
  teacher: [
    '{name} 同学回答得很好，我们顺着她的思路往下走。',
    '先想清楚 {topic} 的第一步是什么，再动笔。',
    '谁能告诉我为什么这里要先找公分母？',
    '{name} 同学的方法很有创意，谁有不同思路？',
    '别着急，慢慢想 —— {topic} 不止一种解法。',
    '提示：先把 {topic} 的已知条件列出来。',
    '{name}，你来把刚才的思路在白板上画一画？',
    '回答问题之前先读题三遍，圈出关键词。',
  ],
  // Student reactions: agree / disagree / ask / answer-short / joke.
  student: [
    '我同意 {name}',
    '我不太确定，{name} 说的是对的吗？',
    '能再说一遍吗？',
    '我觉得答案是 {name}',
    '哈哈 我也这么算的',
    '等一下，我有点糊涂了',
    '我刚才算错了 😅',
    '为什么不是 {name}？',
  ],
} as const;

/** Homework problem templates — these are the "current problem" the
 *  assignment panel renders. The pool mixes math fractions, algebra,
 *  Chinese poems, and English vocab so the demo shows real subject
 *  variety. */
export interface DemoProblem {
  /** e.g. "第 3 题" / "Q5" / "练习 12" */
  badge: string;
  /** "⭐" / "⭐⭐" / "⭐⭐⭐" — UI just renders the literal string. */
  difficulty: string;
  /** Common Core / textbook code, e.g. "4-NF-A-2". */
  code: string;
  /** Chinese problem text (the panel renders it verbatim). For math
   *  fractions the UI splits the string at "1/2" style tokens into
   *  a `<span class="fraction">` automatically — see
   *  `extractFractions` in the assignment panel. */
  text: string;
}

export const DEMO_PROBLEM_TEMPLATES: readonly DemoProblem[] = [
  {
    badge: '第 3 题',
    difficulty: '⭐⭐',
    code: '4-NF-A-2',
    text: '1/2 + 1/3 = ?',
  },
  {
    badge: '第 5 题',
    difficulty: '⭐⭐⭐',
    code: '4-NF-A-2',
    text: '3/4 - 1/6 = ?',
  },
  {
    badge: '第 8 题',
    difficulty: '⭐⭐',
    code: '5-NF-A-1',
    text: '2/3 + 1/4 = ?',
  },
  {
    badge: '第 11 题',
    difficulty: '⭐⭐⭐',
    code: '6-EE-A-2',
    text: '求 x：2x + 5 = 17',
  },
  {
    badge: '第 12 题',
    difficulty: '⭐',
    code: '6-EE-B-5',
    text: '求 x：3x - 4 = 11',
  },
  {
    badge: '古诗 4',
    difficulty: '⭐',
    code: '人教·语文·三上',
    text: '"停车坐爱枫林晚" 的下一句是什么？',
  },
  {
    badge: '古诗 7',
    difficulty: '⭐⭐',
    code: '人教·语文·四上',
    text: '"欲穷千里目" 的下一句是什么？',
  },
  {
    badge: 'Vocabulary 6',
    difficulty: '⭐⭐',
    code: 'PEP·英语·五上',
    text: '写出 "weather" 的两个同义词。',
  },
  {
    badge: 'Vocabulary 9',
    difficulty: '⭐⭐⭐',
    code: 'PEP·英语·六上',
    text: '用 "because" 造一个因果复合句。',
  },
] as const;

/** Mistake templates — each surfaces a short question label, a
 *  status glyph, and a brief reason. */
export interface DemoMistake {
  q: string;
  status: '✗' | '⏱';
  reason: string;
}

export const DEMO_MISTAKE_TEMPLATES: readonly DemoMistake[] = [
  { q: '1/4 + 1/6 = ?', status: '✗', reason: '公分母错' },
  { q: '2/3 + 1/4 = ?', status: '✗', reason: '计算粗心' },
  { q: '5/6 - 1/3 = ?', status: '⏱', reason: '待复习' },
  { q: '3/8 + 1/2 = ?', status: '✗', reason: '通分遗漏' },
  { q: '求 x：4x - 3 = 9', status: '✗', reason: '移项错' },
  { q: '7/9 - 1/3 = ?', status: '⏱', reason: '超时' },
  { q: '1/2 + 1/4 + 1/8 = ?', status: '✗', reason: '约分错' },
  { q: '"举头望明月" 的下一句？', status: '✗', reason: '记混' },
  { q: '"日照香炉生紫烟" 的下一句？', status: '⏱', reason: '超时' },
  { q: 'write 的过去式？', status: '✗', reason: '拼写错' },
] as const;

/** Mode tabs (header). 3 entries — the demo shell wires the first
 *  one as active. */
export const DEMO_MODE_TABS: readonly string[] = [
  '✏️ 作业',
  '📖 复习',
  '💬 自由',
] as const;

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
  /** Map from `agent_id` (e.g. `"agent-0-👵"`) to the display name the
   *  page should render on the desk label (e.g. `"小红"`). The agent_id
   *  encoding keeps `ClassroomState.seatLayout.agent_id` unique and
   *  emoji-seedable, while this map keeps the human-readable name
   *  available without extending `ClassroomState`. */
  displayNameByAgentId: Record<string, string>;
  /** Seed that produced this generation — echoed back so the page can
   *  surface it (e.g. in a hidden DOM attribute for visual snapshots). */
  seed: number;
  /** B.1.3 — chat history strip rendered above the blackboard. 5–15
   *  entries mixing teacher / student / user roles with monotonic
   *  timestamps. */
  chatHistory: DemoChatMessage[];
  /** B.1.3 — courseware outline (3–8 slides) with the current one
   *  marked active. Drives the blackboard "step" rail in future
   *  iterations; for now the demo shell only renders the outline as
   *  informational metadata. */
  courseware: { outline: string[]; currentSlide: number };
  /** B.1.3 — the right-hand assignment panel payload: a single
   *  `DemoProblem` (the current problem) plus a 3–8-item mistake
   *  list. */
  homework: { problem: DemoProblem; mistakes: DemoMistake[] };
  /** B.1.3 — top-header payload: pomodoro timer (seconds remaining
   *  in the lesson, 0–25 min), the mode tabs (length 3), the active
   *  tab index, the teacher's display name, and the chat-badge
   *  count. */
  header: {
    pomodoroSeconds: number;
    modeTabs: string[];
    activeMode: number;
    teacherName: string;
    chatBadgeCount: number;
  };
}

/** B.1.3 — single chat-history row. `role` drives both the bubble
 *  colour + alignment (teacher = white / agent = pink / user = primary
 *  purple, right-aligned). `agentId` / `displayName` are only set on
 *  student-role messages; teacher rows always show `小诺姐姐` and
 *  user rows render anonymously (right-aligned, no name). */
export interface DemoChatMessage {
  id: string;
  role: 'teacher' | 'student' | 'user';
  /** Agent id for student-role messages (used to look up the seat
   *  bubble color). `undefined` for teacher / user rows. */
  agentId?: string;
  /** Display name for student-role messages. `undefined` for
   *  teacher / user rows. */
  displayName?: string;
  content: string;
  /** Epoch ms. Monotonic non-decreasing across the array. */
  timestamp: number;
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

  // ============================================================
  // B.1.3 — auxiliary demo payloads (chat history / courseware /
  // homework / header). All deterministic per seed so the unit
  // tests can pin them down.
  // ============================================================

  // ---- Chat history (5–15 entries, monotonic timestamps) ----
  const chatCount = randInt(rng, 5, 15);
  const chatHistory: DemoChatMessage[] = [];
  // Start ~3 minutes into the lesson and step every 12–40 seconds.
  let chatTimestamp = effectiveSeed - 3 * 60 * 1000 - randInt(rng, 0, 30) * 1000;
  for (let i = 0; i < chatCount; i += 1) {
    const roleRoll = rng();
    const role: DemoChatMessage['role'] =
      roleRoll < 0.45 ? 'teacher' : roleRoll < 0.85 ? 'student' : 'user';
    const stepMs = randInt(rng, 12, 40) * 1000;
    chatTimestamp += stepMs;
    if (role === 'teacher') {
      const template = pick(rng, DEMO_CHAT_TEMPLATES.teacher);
      const studentName =
        seats.length > 0
          ? idByAgent[seats[randInt(rng, 0, seats.length - 1)].agent_id] ?? '同学'
          : '同学';
      chatHistory.push({
        id: `msg-${i}`,
        role: 'teacher',
        content: fillTemplate(template, { name: studentName, topic: lessonLabel }),
        timestamp: chatTimestamp,
      });
    } else if (role === 'student') {
      const template = pick(rng, DEMO_CHAT_TEMPLATES.student);
      const targetSeat =
        seats.length > 0
          ? seats[randInt(rng, 0, seats.length - 1)]
          : null;
      const targetName = targetSeat ? (idByAgent[targetSeat.agent_id] ?? '同学') : '同学';
      chatHistory.push({
        id: `msg-${i}`,
        role: 'student',
        agentId: targetSeat?.agent_id,
        displayName: targetName,
        content: fillTemplate(template, { name: targetName }),
        timestamp: chatTimestamp,
      });
    } else {
      chatHistory.push({
        id: `msg-${i}`,
        role: 'user',
        content: pick(rng, [
          '我不太明白这一步',
          '可以再讲一遍吗？',
          '我算出来是 5/6',
          '举手可以吗？',
          '等一下，我没听懂',
        ]),
        timestamp: chatTimestamp,
      });
    }
  }

  // ---- Courseware outline (3–8 slides) ----
  const coursewareCount = randInt(rng, 3, 8);
  const coursewareOutline: string[] = [];
  for (let i = 0; i < coursewareCount; i += 1) {
    coursewareOutline.push(`第 ${i + 1} 节 · ${pick(rng, DEMO_LESSONS)}`);
  }
  const currentSlide = randInt(rng, 0, coursewareCount - 1);

  // ---- Homework (current problem + 3–8 mistakes) ----
  const problem = pick(rng, DEMO_PROBLEM_TEMPLATES);
  const mistakeCount = randInt(rng, 3, Math.min(8, DEMO_MISTAKE_TEMPLATES.length));
  const shuffledMistakes = shuffle(rng, DEMO_MISTAKE_TEMPLATES.slice());
  const mistakes = shuffledMistakes.slice(0, mistakeCount);

  // ---- Header (pomodoro + mode tabs + chat badge) ----
  const pomodoroSeconds = randInt(rng, 0, 25 * 60);
  const activeMode = randInt(rng, 0, DEMO_MODE_TABS.length - 1);
  const chatBadgeCount = chatHistory.length;

  const generation: DemoGeneration = {
    classroom,
    dynamic,
    displayNameByAgentId: idByAgent,
    seed: effectiveSeed,
    chatHistory,
    courseware: { outline: coursewareOutline, currentSlide },
    homework: { problem, mistakes },
    header: {
      pomodoroSeconds,
      modeTabs: DEMO_MODE_TABS.slice(),
      activeMode,
      teacherName: '小诺姐姐',
      chatBadgeCount,
    },
  };
  return generation;
}
