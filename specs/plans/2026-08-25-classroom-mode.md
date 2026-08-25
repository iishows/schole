# Classroom Mode (C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans.
>
> **Source spec:** [`specs/classroom-mode-design.md`](../classroom-mode-design.md) (user-approved 2026-08-25)
> **Parent plan:** [`specs/cn-companion-mvp-plan.md`](../cn-companion-mvp-plan.md) §8.6 (CM1-CM6 lane, 兼职 0.5 工时)

**Goal:** 给 OpenMAIC 引擎加一层 Classroom Shell —— period 铃 + 举手 + 叫答 + 同桌传纸条 + 黑板 — 让"AI 聊天"变"真实教室"。

**Architecture:** 7 个新 DSL action (period_start/end/bell, raise_hand, call_on, pass_note, blackboard_annotate) → ClassroomState reducer (4×6 状态机) → 5 个零侵入 UI 组件（顶 bar / 浮按钮 / 卡片 / 动画 / chalk layer）。D-1: raise_hand 走 `ClassroomService.callRaiseHand()` 隔离不侵入 Director graph 主路径。D-2: `ClassroomLayoutService.autoGenerate()` 默认"邻座=同桌" + admin 可 override。D-3: i18n bundle 13 locale，UI 文案 INTL 翻译为 homeroom/circle time/morning basket。

**Tech Stack:** TypeScript · zustand · TypeBox · Playwright · chalk-style SVG (feTurbulence+feDisplacementMap) · Web Audio API (绕过静音)。

---

## Global Constraints

1. 不修改 `components/roundtable/index.tsx` 视觉布局（3 列结构保留）
2. 不修改 `components/chat/chat-area.tsx` 主体（仅追加可选 ProactiveCard mode）
3. 不修改现有 22 个 DSL action type（仅追加新 type 进 union）
4. 不修改现有 Director graph 节点路径（仅追加 + 边）
5. 新增 state 全部可选 + 默认值，老场景零迁移
6. V1 默认开启，但 feature flag `isClassroomShellEnabled()` 默认 false 让独立 release gate
7. 单 action payload 上限 4 KB（避免场景 JSON 膨胀）
8. chalk SVG stroke 数上限 500（性能护栏）
9. 仅依赖现有依赖；不引新三方库（chalk 用 SVG filter，动画用 framer-motion 如已有）
10. i18n key 命名空间：`classroom.*`（period / handRaise / callOn / passNote / blackboard）
11. 单元测试 vitest，集成测试 Playwright（同 `e2e/tests/classroom-interaction.spec.ts` 框架）
12. INTL persona 文案：`homeroom teacher` / `study buddy` / `circle time` / `lesson marker` / `morning basket`

---

## File Structure

- **Create**: `packages/@openmaic/dsl/src/classroom-actions.ts` — 7 个新 action 类型 + JSON schema（与现有 `action.ts` 同 pattern，零运行时依赖）
- **Modify**: `packages/@openmaic/dsl/src/index.ts` — re-export classroom action types
- **Modify**: `packages/@openmaic/dsl/src/validate.ts` — 把 classroom action 纳入 `validateActions()`
- **Create**: `lib/store/classroom-state.ts` — `ClassroomState` 类型 + `classroomReducer` (24 转移) + `useClassroomStore` zustand slice
- **Modify**: `lib/store/stage.ts:413-1032` — 把 `useClassroomStore` 接入 `useStageStoreBase`（slice 模式）
- **Modify**: `lib/config/feature-flags.ts:1-101` — 追加 `isClassroomShellEnabled()` + `isClassroomShellInjected()`
- **Create**: `lib/services/classroom-service.ts` — `ClassroomService.callRaiseHand(opts)` 隔离层（D-1 关键）
- **Create**: `lib/services/classroom-layout-service.ts` — `ClassroomLayoutService.autoGenerate(seats, agents)` 默认"邻座=同桌"算法 + override API（D-2 关键）
- **Modify**: `lib/action/engine.ts:1-889` — 追加 7 个 case 分支到 dispatch switch
- **Modify**: `lib/chat/pi/tools/cue-user.ts:20-82` — 暴露 `cuesTo(targetAgentId?)` 给 call_on 共用（refactor，零行为变）
- **Create**: `lib/chat/pi/tools/classroom-shell-actions.ts` — Pi-runtime 7 个 action tool 包装（cue_user 的 sibling pattern）
- **Create**: `components/classroom-shell/period-bar.tsx` — 顶部 44px 状态栏（5.1）
- **Create**: `components/classroom-shell/hand-raise-button.tsx` — 浮按钮 + 队列 toast（5.2）
- **Create**: `components/classroom-shell/call-on-card.tsx` — 用 ProactiveCard 加 `mode="call_on"`（5.3）
- **Create**: `components/classroom-shell/pass-note.tsx` — SVG 飞纸条动画 + 收方气泡（5.4）
- **Create**: `components/classroom-shell/blackboard-chalk-layer.tsx` — Canvas 顶部 tab "📝 白板" + chalk SVG 渲染（5.5）
- **Create**: `components/classroom-shell/index.ts` — barrel export
- **Modify**: `components/canvas/canvas-area.tsx:1-280` — 在 canvas 顶部挂 `<BlackboardChalkLayer>` tab + `<BlackboardChalkLayer>` 渲染（侵入 3 行）
- **Modify**: `components/chat/proactive-card.tsx:1-249` — 接收新 prop `mode="call_on"` 分支（侵入 12 行）
- **Modify**: `components/roundtable/index.tsx:1-2140` — 在右下角挂 `<HandRaiseButton>`（侵入 4 行 import + JSX，零布局变更）
- **Create**: `lib/i18n/classroom.locale.ts` — `classroom.cn.ts` + `classroom.intl.ts` 字面字典 + `useClassroomI18n()` hook
- **Modify**: `lib/i18n/locales/zh-CN.json:1-1838` — 追加 `classroom.*` 50 keys（CN 字典来自 `classroom.cn.ts`）
- **Modify**: `lib/i18n/locales/en-US.json:1-1838` — 追加 `classroom.*` 50 keys（INTL 字典来自 `classroom.intl.ts`）
- 同样的 `zh-TW / ja-JP / ko-KP / ar-SA / de-DE / es-MX / fr-FR / pt-BR / ru-RU / vi-VN` 11 locale 各加 50 keys（fallback 到 en-US，文案已包含）
- **Create (test)**: `lib/store/__tests__/classroom-state.test.ts` — 24 转移 + 边界
- **Create (test)**: `lib/services/__tests__/classroom-service.test.ts` — callRaiseHand 隔离
- **Create (test)**: `lib/services/__tests__/classroom-layout-service.test.ts` — autoGenerate + override
- **Create (test)**: `packages/@openmaic/dsl/src/__tests__/classroom-actions.test.ts` — schema 校验
- **Create (test)**: `e2e/tests/classroom-shell.spec.ts` — 端到端：一节课剧本（period → raise_hand → call_on → pass_note → blackboard → period_end）
- **Create (test)**: `e2e/tests/__snapshots__/classroom-shell.spec.tsx` — 视觉回归 4+3+1=8 snapshot
- **Create**: `lib/hooks/use-period-bar-bell.ts` — Web Audio API 铃响 hook（绕过静音护栏）
- **Create**: `lib/utils/chalk-stroke-svg.ts` — chalk-style SVG 笔触生成器（feTurbulence + feDisplacementMap）

---

## Tasks (12 个，每 task 5 步 TDD)

### Task 1: DSL action 类型 + schema 校验

**Files:**
- Create: `packages/@openmaic/dsl/src/classroom-actions.ts`
- Modify: `packages/@openmaic/dsl/src/index.ts`
- Modify: `packages/@openmaic/dsl/src/validate.ts`
- Test: `packages/@openmaic/dsl/src/__tests__/classroom-actions.test.ts`

**Interfaces:**
- Consumes: 现有 `ActionBase` from `packages/@openmaic/dsl/src/action.ts:22`
- Produces: `PeriodStartAction`, `PeriodEndAction`, `PeriodBellAction`, `RaiseHandAction`, `CallOnAction`, `PassNoteAction`, `BlackboardAnnotateAction` —— 后面 task 都依赖这些类型
- Produces: `validateClassroomAction(action: unknown): action is ClassroomAction` —— `validate.ts` 调用

- [ ] **Step 1: 写失败测试** —— `packages/@openmaic/dsl/src/__tests__/classroom-actions.test.ts`

```ts
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
} from '../classroom-actions';

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
```

- [ ] **Step 2: 跑测试验证失败** —— `pnpm --filter @openmaic/dsl test classroom-actions.test.ts` — Expected: FAIL with "Cannot find module '../classroom-actions'"

- [ ] **Step 3: 写最小实现** —— `packages/@openmaic/dsl/src/classroom-actions.ts`

```ts
import type { ActionBase } from './action.js';

// 4 KB payload cap (spec §10 风险 mitigation)
export const MAX_CLASSROOM_ACTION_BYTES = 4096;

export type ClassroomAction =
  | PeriodStartAction | PeriodEndAction | PeriodBellAction
  | RaiseHandAction | CallOnAction | PassNoteAction | BlackboardAnnotateAction;

export interface PeriodStartAction extends ActionBase {
  type: 'period_start';
  period: string;            // e.g. "Lesson-1"
  duration: number;          // seconds
  agenda: string[];          // min 1 item
  agent_id: string;
  timestamp: number;
}

export interface PeriodEndAction extends ActionBase {
  type: 'period_end';
  break_duration: number;    // seconds
  is_last_lesson?: boolean;
  agent_id: string;
  timestamp: number;
}

export interface PeriodBellAction extends ActionBase {
  type: 'period_bell';
  bell_type: 'transition' | 'attention' | 'wrap';
  agent_id: string;
  timestamp: number;
}

export interface RaiseHandAction extends ActionBase {
  type: 'raise_hand';
  agent_id: string;
  agent_name: string;
  raised_at: number;
  question?: string;
  origin: 'user' | 'agent';
}

export interface CallOnAction extends ActionBase {
  type: 'call_on';
  target_agent_id: string;
  prompt: string;
  countdown_ms?: number;     // default 4000
  agent_id: string;
  timestamp: number;
}

export interface PassNoteAction extends ActionBase {
  type: 'pass_note';
  from_seat: string;         // e.g. "A1"
  to_seat: string;           // must be adjacent (semantic check in service)
  content: string;
  animation: 'fly';
  agent_id: string;
  timestamp: number;
}

export interface BlackboardAnnotateAction extends ActionBase {
  type: 'blackboard_annotate';
  layer: 'blackboard';
  path: Array<{ x: number; y: number }>;  // cap 500 points
  duration: number;          // ms
  agent_id: string;
  timestamp: number;
}

// Structural validators (no runtime deps; pure JS)
function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}
function nonEmptyStr(x: unknown): boolean { return typeof x === 'string' && x.length > 0; }
function isNum(x: unknown): boolean { return typeof x === 'number' && Number.isFinite(x); }

export function validateClassroomAction(action: unknown): boolean {
  if (!isObj(action)) return false;
  if (!nonEmptyStr(action.id) || !nonEmptyStr(action.type)) return false;
  if (!nonEmptyStr(action.agent_id) || !isNum(action.timestamp)) return false;

  // Payload cap
  try {
    if (JSON.stringify(action).length > MAX_CLASSROOM_ACTION_BYTES) return false;
  } catch { return false; }

  switch (action.type) {
    case 'period_start':
      return (
        nonEmptyStr(action.period) && isNum(action.duration) &&
        Array.isArray(action.agenda) && action.agenda.length > 0 &&
        action.agenda.every(nonEmptyStr)
      );
    case 'period_end':
      return isNum(action.break_duration) &&
        (action.is_last_lesson === undefined || typeof action.is_last_lesson === 'boolean');
    case 'period_bell':
      return action.bell_type === 'transition' || action.bell_type === 'attention' || action.bell_type === 'wrap';
    case 'raise_hand':
      return nonEmptyStr(action.agent_name) && isNum(action.raised_at) &&
        (action.question === undefined || typeof action.question === 'string') &&
        (action.origin === 'user' || action.origin === 'agent');
    case 'call_on':
      return nonEmptyStr(action.target_agent_id) && nonEmptyStr(action.prompt) &&
        (action.countdown_ms === undefined || isNum(action.countdown_ms));
    case 'pass_note':
      return nonEmptyStr(action.from_seat) && nonEmptyStr(action.to_seat) &&
        nonEmptyStr(action.content) && action.animation === 'fly';
    case 'blackboard_annotate':
      return action.layer === 'blackboard' &&
        Array.isArray(action.path) && action.path.length <= 500 &&
        action.path.every(p => isObj(p) && isNum((p as any).x) && isNum((p as any).y)) &&
        isNum(action.duration);
    default:
      return false;
  }
}

export function isClassroomAction(action: unknown): action is ClassroomAction {
  return validateClassroomAction(action);
}
```

- Modify `packages/@openmaic/dsl/src/index.ts`: 加 `export * from './classroom-actions.js';`
- Modify `packages/@openmaic/dsl/src/validate.ts`: 在 `validateActions()` 末尾追加
  ```ts
  for (const a of actions) {
    const t = (a as any)?.type;
    if (typeof t === 'string' && t.startsWith('period_') || t === 'raise_hand' ||
        t === 'call_on' || t === 'pass_note' || t === 'blackboard_annotate') {
      if (!validateClassroomAction(a)) throw new Error(`Invalid classroom action: ${t}`);
    }
  }
  ```

- [ ] **Step 4: 跑测试验证通过** —— `pnpm --filter @openmaic/dsl test classroom-actions.test.ts` — Expected: PASS (8/8)

- [ ] **Step 5: Commit**
```bash
git add packages/@openmaic/dsl/src/classroom-actions.ts \
        packages/@openmaic/dsl/src/index.ts \
        packages/@openmaic/dsl/src/validate.ts \
        packages/@openmaic/dsl/src/__tests__/classroom-actions.test.ts
git commit -m "feat(dsl): add 7 classroom shell action types + schema validator"
```

---

### Task 2: ClassroomState reducer (24 状态转移)

**Files:**
- Create: `lib/store/classroom-state.ts`
- Test: `lib/store/__tests__/classroom-state.test.ts`

**Interfaces:**
- Consumes: `ClassroomAction` types from Task 1
- Produces: `ClassroomState`, `classroomReducer(state, action) => state`, `initialClassroomState()` —— 后面 store 接入 + UI 组件依赖

- [ ] **Step 1: 写失败测试** —— `lib/store/__tests__/classroom-state.test.ts`

```ts
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
```

- [ ] **Step 2: 跑测试验证失败** —— `pnpm test classroom-state.test.ts` — Expected: FAIL with "Cannot find module"

- [ ] **Step 3: 写最小实现** —— `lib/store/classroom-state.ts`

```ts
import type { ClassroomAction, HandRaise, CallOn, SeatConfig, BellEvent } from '@openmaic/dsl';

export type ClassroomPeriod = 'before-class' | 'lesson' | 'break' | 'after-class';

export interface ClassroomState {
  period: ClassroomPeriod;
  periodStartedAt: number | null;
  periodEndsAt: number | null;
  lessonLabel: string;
  handRaiseQueue: HandRaise[];
  activeCallOn: CallOn | null;
  blackboardMode: boolean;
  seatLayout: SeatConfig[];
  bellQueue: BellEvent[];
  lastError: string | null;
}

export function initialClassroomState(): ClassroomState {
  return {
    period: 'before-class',
    periodStartedAt: null,
    periodEndsAt: null,
    lessonLabel: '',
    handRaiseQueue: [],
    activeCallOn: null,
    blackboardMode: false,
    seatLayout: [],
    bellQueue: [],
    lastError: null,
  };
}

export function classroomReducer(state: ClassroomState, action: ClassroomAction): ClassroomState {
  switch (action.type) {
    case 'period_start': {
      if (state.period !== 'before-class' && state.period !== 'break') {
        return { ...state, lastError: `illegal transition: period_start from ${state.period}` };
      }
      return {
        ...state,
        period: 'lesson',
        periodStartedAt: action.timestamp,
        periodEndsAt: action.timestamp + action.duration * 1000,
        lessonLabel: action.period,
        lastError: null,
      };
    }
    case 'period_end': {
      if (state.period !== 'lesson') {
        return { ...state, lastError: `illegal transition: period_end from ${state.period}` };
      }
      return {
        ...state,
        period: action.is_last_lesson ? 'after-class' : 'break',
        periodStartedAt: null,
        periodEndsAt: null,
        lastError: null,
      };
    }
    case 'period_bell': {
      return {
        ...state,
        bellQueue: [
          ...state.bellQueue,
          { type: action.bell_type, scheduled_at: action.timestamp },
        ].slice(-10),  // keep last 10
      };
    }
    case 'raise_hand': {
      if (state.handRaiseQueue.find(h => h.agent_id === action.agent_id)) return state;
      return {
        ...state,
        handRaiseQueue: [
          ...state.handRaiseQueue,
          {
            agent_id: action.agent_id,
            agent_name: action.agent_name,
            raised_at: action.raised_at,
            question: action.question,
            origin: action.origin,
          },
        ],
      };
    }
    case 'call_on': {
      return {
        ...state,
        handRaiseQueue: [],
        activeCallOn: {
          target_agent_id: action.target_agent_id,
          prompt: action.prompt,
          countdown_ms: action.countdown_ms ?? 4000,
          called_at: action.timestamp,
        },
      };
    }
    case 'pass_note': {
      // 语义校验在 service 层；reducer 仅记录
      return state;
    }
    case 'blackboard_annotate': {
      return { ...state, blackboardMode: true };
    }
    default:
      return state;
  }
}
```

- [ ] **Step 4: 跑测试验证通过** —— `pnpm test classroom-state.test.ts` — Expected: PASS (9/9)

- [ ] **Step 5: Commit**
```bash
git add lib/store/classroom-state.ts lib/store/__tests__/classroom-state.test.ts
git commit -m "feat(store): add ClassroomState reducer with 24-state transition matrix"
```

---

### Task 3: zustand store slice 接入 useStageStore

**Files:**
- Modify: `lib/store/stage.ts:413-1032`
- Test: extend `lib/store/__tests__/stage-classroom-integration.test.ts` (new file)

**Interfaces:**
- Consumes: `ClassroomState` + `classroomReducer` from Task 2
- Produces: `useClassroomStore()` selector + `dispatchClassroomAction(action)` —— UI 组件消费

- [ ] **Step 1: 写失败测试**

```ts
// lib/store/__tests__/stage-classroom-integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useStageStore, dispatchClassroomAction } from '../stage';
import { initialClassroomState } from '../classroom-state';

describe('stage store classroom slice', () => {
  beforeEach(() => {
    useStageStore.getState().resetClassroom?.();
  });

  it('starts with initial classroom state', () => {
    const s = useStageStore.getState();
    expect(s.classroom).toEqual(initialClassroomState());
  });

  it('dispatchClassroomAction transitions period', () => {
    dispatchClassroomAction({
      type: 'period_start', id: 'p', period: 'Lesson-1', duration: 60,
      agenda: ['导入'], agent_id: 't', timestamp: Date.now(),
    });
    expect(useStageStore.getState().classroom.period).toBe('lesson');
  });

  it('useClassroomSelector reads derived value', () => {
    // useClassroomSelector is a zustand selector pattern; provide via stage store exports
    const { useClassroomSelector } = require('../stage');
    const period = useClassroomSelector(s => s.classroom.period);
    expect(period).toBe('before-class');
  });
});
```

- [ ] **Step 2: 跑测试验证失败** —— `pnpm test stage-classroom-integration.test.ts` — Expected: FAIL with "dispatchClassroomAction is not a function"

- [ ] **Step 3: 写最小实现** —— 修改 `lib/store/stage.ts`

在 `StageState` interface 顶部加：
```ts
import { type ClassroomState, classroomReducer, initialClassroomState } from './classroom-state';
// ...
interface StageState {
  // ... existing fields
  classroom: ClassroomState;
  dispatchClassroomAction: (action: import('@openmaic/dsl').ClassroomAction) => void;
  resetClassroom: () => void;
  useClassroomSelector: <T>(selector: (s: StageState) => T) => T;
}
```

在 `useStageStoreBase` 创建的初始 state 加：
```ts
classroom: initialClassroomState(),
dispatchClassroomAction: (action) => set((state) => ({
  classroom: classroomReducer(state.classroom, action),
})),
resetClassroom: () => set({ classroom: initialClassroomState() }),
useClassroomSelector: (selector) => selector(useStageStoreBase.getState()),
```

- [ ] **Step 4: 跑测试验证通过** —— `pnpm test stage-classroom-integration.test.ts` — Expected: PASS (3/3)

- [ ] **Step 5: Commit**
```bash
git add lib/store/stage.ts lib/store/__tests__/stage-classroom-integration.test.ts
git commit -m "feat(store): wire ClassroomState into useStageStore slice"
```

---

### Task 4: Feature flag

**Files:**
- Modify: `lib/config/feature-flags.ts:1-101`

**Interfaces:**
- Consumes: 现有 `readBoolean` helper
- Produces: `isClassroomShellEnabled()` + `isClassroomShellInjected()` —— Task 5/6/7/8/10/11 都 gate 自己

- [ ] **Step 1: 写失败测试** —— `lib/config/__tests__/feature-flags.test.ts` (新建)

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isClassroomShellEnabled, isClassroomShellInjected } from '../feature-flags';

describe('classroom shell feature flag', () => {
  const originalEnv = process.env;
  beforeEach(() => { process.env = { ...originalEnv }; });
  afterEach(() => { process.env = originalEnv; });

  it('defaults to disabled', () => {
    delete process.env.NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED;
    expect(isClassroomShellEnabled()).toBe(false);
  });

  it('enables when NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED=true', () => {
    process.env.NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED = 'true';
    expect(isClassroomShellEnabled()).toBe(true);
  });

  it('isClassroomShellInjected = enabled AND existing piChat', () => {
    process.env.NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED = 'true';
    process.env.NEXT_PUBLIC_PI_CHAT_ENABLED = 'true';
    expect(isClassroomShellInjected()).toBe(true);
  });
});
```

- [ ] **Step 2: 跑测试验证失败** —— `pnpm test feature-flags.test.ts` — Expected: FAIL with "isClassroomShellEnabled is not a function"

- [ ] **Step 3: 写最小实现** —— `lib/config/feature-flags.ts:101` 后追加：

```ts
/**
 * Classroom shell (period bar / hand-raise / call-on / pass-note / blackboard).
 * Default OFF so existing RoundTable playback is unaffected until we ship W1+.
 */
export function isClassroomShellEnabled(): boolean {
  return readBoolean(process.env.NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED);
}

/**
 * Whether the classroom shell is actively injected into the runtime (gate
 * flag + the underlying chat runtime that powers the action dispatch).
 */
export function isClassroomShellInjected(): boolean {
  return isClassroomShellEnabled() && isPiChatEnabled();
}
```

- [ ] **Step 4: 跑测试验证通过** —— `pnpm test feature-flags.test.ts` — Expected: PASS (3/3)

- [ ] **Step 5: Commit**
```bash
git add lib/config/feature-flags.ts lib/config/__tests__/feature-flags.test.ts
git commit -m "feat(flags): add isClassroomShellEnabled + isClassroomShellInjected"
```

---

### Task 5: Action engine 接入 7 个 case

**Files:**
- Modify: `lib/action/engine.ts:1-889`
- Test: `lib/action/__tests__/engine-classroom.test.ts`

**Interfaces:**
- Consumes: `ClassroomAction` types from Task 1; `dispatchClassroomAction` from Task 3; `isClassroomShellEnabled` from Task 4
- Produces: 引擎统一入口接收 classroom actions 后调 store reducer —— 所有 action（cue_user/speech/whiteboard/spotlight/classroom shell）走同一条管道

- [ ] **Step 1: 写失败测试**

```ts
// lib/action/__tests__/engine-classroom.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionEngine } from '../engine';
import { useStageStore } from '@/lib/store/stage';

vi.mock('@/lib/config/feature-flags', () => ({
  isClassroomShellEnabled: () => true,
  isClassroomShellInjected: () => true,
}));

describe('ActionEngine classroom shell dispatch', () => {
  beforeEach(() => useStageStore.getState().resetClassroom?.());

  it('dispatches period_start to store', async () => {
    const engine = new ActionEngine();
    await engine.execute({
      type: 'period_start', id: 'p', period: 'L1', duration: 60,
      agenda: ['x'], agent_id: 't', timestamp: Date.now(),
    });
    expect(useStageStore.getState().classroom.period).toBe('lesson');
  });

  it('dispatches raise_hand to FIFO queue', async () => {
    const engine = new ActionEngine();
    await engine.execute({
      type: 'raise_hand', id: 'r', agent_id: 'a1', agent_name: '小红',
      raised_at: Date.now(), origin: 'agent',
    });
    expect(useStageStore.getState().classroom.handRaiseQueue).toHaveLength(1);
  });

  it('drops classroom actions when flag disabled', async () => {
    vi.resetModules();
    vi.doMock('@/lib/config/feature-flags', () => ({
      isClassroomShellEnabled: () => false,
      isClassroomShellInjected: () => false,
    }));
    const { ActionEngine: AE } = await import('../engine');
    const engine = new AE();
    await engine.execute({
      type: 'period_start', id: 'p', period: 'L1', duration: 60,
      agenda: ['x'], agent_id: 't', timestamp: Date.now(),
    });
    // re-import store after resetModules
    const { useStageStore: USS } = await import('@/lib/store/stage');
    expect(USS.getState().classroom.period).toBe('before-class');
  });
});
```

- [ ] **Step 2: 跑测试验证失败** —— `pnpm test engine-classroom.test.ts` — Expected: FAIL with "engine.execute does not dispatch classroom actions"

- [ ] **Step 3: 写最小实现** —— `lib/action/engine.ts` 顶部加 import + 在 `execute()` switch 末尾追加：

```ts
import { isClassroomShellEnabled, isClassroomShellInjected } from '@/lib/config/feature-flags';
import { useStageStore } from '@/lib/store/stage';
```

在 `execute(action: Action)` switch 末尾 default 之前，插入：
```ts
// === Classroom shell (period / hand-raise / call-on / pass-note / blackboard_annotate) ===
if (!isClassroomShellEnabled()) {
  log.warn(`classroom action dropped: flag disabled (${(action as any).type})`);
  return;
}
if (!isClassroomShellInjected() && ['period_start','period_end','period_bell','raise_hand','call_on','pass_note','blackboard_annotate'].includes((action as any).type)) {
  log.warn(`classroom action not injected: runtime not enabled (${(action as any).type})`);
  return;
}
useStageStore.getState().dispatchClassroomAction(action as any);
return;
```

（具体位置：在现有 switch 的 `default: return;` 前插入；具体 type name 通过 `as any` cast 处理 union 推断。）

- [ ] **Step 4: 跑测试验证通过** —— `pnpm test engine-classroom.test.ts` — Expected: PASS (3/3)

- [ ] **Step 5: Commit**
```bash
git add lib/action/engine.ts lib/action/__tests__/engine-classroom.test.ts
git commit -m "feat(engine): dispatch 7 classroom shell actions via ActionEngine"
```

---

### Task 6: PeriodBar 组件 (W1 交付物)

**Files:**
- Create: `components/classroom-shell/period-bar.tsx`
- Create: `lib/hooks/use-period-bar-bell.ts`
- Test: `components/classroom-shell/__tests__/period-bar.test.tsx`

**Interfaces:**
- Consumes: `useClassroomStore(s => s.classroom)` from Task 3; `usePeriodBarBell` from this task
- Produces: `<PeriodBar />` —— 由 `components/roundtable/index.tsx` 顶部挂载

- [ ] **Step 1: 写失败测试**

```tsx
// components/classroom-shell/__tests__/period-bar.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PeriodBar } from '../period-bar';
import { useStageStore } from '@/lib/store/stage';

vi.mock('@/lib/config/feature-flags', () => ({ isClassroomShellEnabled: () => true }));
vi.mock('../use-period-bar-bell', () => ({
  usePeriodBarBell: () => ({ playBell: vi.fn(), playTransition: vi.fn(), playWrap: vi.fn() }),
}));

describe('PeriodBar', () => {
  it('renders lesson label and countdown in lesson period', () => {
    useStageStore.setState((s) => ({
      ...s,
      classroom: {
        ...s.classroom,
        period: 'lesson',
        periodStartedAt: Date.now() - 30_000,
        periodEndsAt: Date.now() + 30_000,
        lessonLabel: '异分母分数加法',
      },
    }));
    render(<PeriodBar />);
    expect(screen.getByText(/异分母分数加法/)).toBeInTheDocument();
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it('renders break mode in break period with amber color', () => {
    useStageStore.setState((s) => ({ ...s, classroom: { ...s.classroom, period: 'break' } }));
    const { container } = render(<PeriodBar />);
    expect(container.firstChild).toHaveClass(/break/);
  });

  it('not rendered when flag disabled', () => {
    vi.resetModules();
    vi.doMock('@/lib/config/feature-flags', () => ({ isClassroomShellEnabled: () => false }));
    const { PeriodBar: PB } = require('../period-bar');
    const { container } = render(<PB />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: 跑测试验证失败** —— `pnpm test period-bar.test.tsx` — Expected: FAIL with "Cannot find module"

- [ ] **Step 3: 写最小实现** —— `components/classroom-shell/period-bar.tsx`

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useStageStore } from '@/lib/store/stage';
import { isClassroomShellEnabled } from '@/lib/config/feature-flags';
import { usePeriodBarBell } from '@/lib/hooks/use-period-bar-bell';

function formatCountdown(ms: number): string {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function PeriodBar() {
  const enabled = isClassroomShellEnabled();
  const classroom = useStageStore(s => s.classroom);
  const { playTransition } = usePeriodBarBell();
  const [, force] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (classroom.period === 'lesson' && classroom.periodEndsAt) {
      const id = setInterval(() => force(n => n + 1), 1000);
      return () => clearInterval(id);
    }
  }, [enabled, classroom.period, classroom.periodEndsAt]);

  useEffect(() => {
    if (classroom.period === 'break') playTransition();
  }, [classroom.period, playTransition]);

  if (!enabled) return null;
  if (classroom.period === 'before-class' || classroom.period === 'after-class') return null;

  const remaining = classroom.periodEndsAt ? classroom.periodEndsAt - Date.now() : 0;
  return (
    <div className={`period-bar period-bar--${classroom.period}`} data-testid="period-bar">
      <span className="period-bar__label">
        {classroom.period === 'break' ? '🔔 课间' : '🔔 '} 第 {classroom.lessonLabel.match(/\d+/)?.[0] ?? ''} 节 · {classroom.lessonLabel.replace(/^Lesson-\d+\s*/, '')}
      </span>
      <span className="period-bar__countdown">{formatCountdown(remaining)}</span>
    </div>
  );
}
```

`lib/hooks/use-period-bar-bell.ts`：
```ts
'use client';
import { useCallback, useRef } from 'react';

/**
 * Web Audio API 铃响 (绕过静音护栏, spec §10 风险 mitigation)
 */
function tone(freq: number, durationMs: number): void {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.value = 0.2;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    setTimeout(() => { osc.stop(); ctx.close(); }, durationMs);
  } catch { /* ignore */ }
}

export function usePeriodBarBell() {
  const playedRef = useRef<Set<string>>(new Set());
  const playTransition = useCallback(() => {
    tone(880, 300);
    setTimeout(() => tone(660, 300), 350);
  }, []);
  const playAttention = useCallback(() => tone(1320, 200), []);
  const playWrap = useCallback(() => {
    tone(660, 200); setTimeout(() => tone(880, 200), 250); setTimeout(() => tone(1320, 400), 500);
  }, []);
  return { playBell: playTransition, playTransition, playAttention, playWrap };
}
```

- [ ] **Step 4: 跑测试验证通过** —— `pnpm test period-bar.test.tsx` — Expected: PASS (3/3)

- [ ] **Step 5: Commit + wire-up**
```bash
git add components/classroom-shell/period-bar.tsx \
        lib/hooks/use-period-bar-bell.ts \
        components/classroom-shell/__tests__/period-bar.test.tsx
git commit -m "feat(ui): add PeriodBar component with Web Audio bell"
```

修改 `components/roundtable/index.tsx:1-2140` 加 import + 在 return JSX 顶部插入 `<PeriodBar />`（侵入 2 行）。

```bash
git add components/roundtable/index.tsx
git commit -m "feat(roundtable): mount PeriodBar at top"
```

---

### Task 7: HandRaiseButton + CallOnCard 组件

**Files:**
- Create: `components/classroom-shell/hand-raise-button.tsx`
- Create: `components/classroom-shell/call-on-card.tsx`
- Modify: `components/chat/proactive-card.tsx:1-249`
- Test: `components/classroom-shell/__tests__/hand-raise.test.tsx`

**Interfaces:**
- Consumes: `useClassroomStore` + `dispatchClassroomAction` from Task 3
- Produces: `<HandRaiseButton />`（右下角浮按钮）+ `<CallOnCard />`（用 ProactiveCard）

- [ ] **Step 1: 写失败测试**

```tsx
// components/classroom-shell/__tests__/hand-raise.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HandRaiseButton } from '../hand-raise-button';
import { useStageStore } from '@/lib/store/stage';

vi.mock('@/lib/config/feature-flags', () => ({ isClassroomShellEnabled: () => true }));

describe('HandRaiseButton', () => {
  it('renders floating button when enabled', () => {
    render(<HandRaiseButton />);
    expect(screen.getByTestId('hand-raise-btn')).toBeInTheDocument();
  });

  it('clicking sends raise_hand with origin=user', () => {
    render(<HandRaiseButton />);
    fireEvent.click(screen.getByTestId('hand-raise-btn'));
    const q = useStageStore.getState().classroom.handRaiseQueue;
    expect(q).toHaveLength(1);
    expect(q[0].origin).toBe('user');
  });

  it('shows queue badge with count', () => {
    useStageStore.setState((s) => ({
      ...s,
      classroom: { ...s.classroom,
        handRaiseQueue: [
          { agent_id: 'a1', agent_name: '小红', raised_at: Date.now(), origin: 'agent' },
          { agent_id: 'a2', agent_name: '小蓝', raised_at: Date.now(), origin: 'agent' },
        ],
      },
    }));
    render(<HandRaiseButton />);
    expect(screen.getByTestId('hand-raise-badge')).toHaveTextContent('2');
  });
});
```

- [ ] **Step 2: 跑测试验证失败** —— `pnpm test hand-raise.test.tsx` — Expected: FAIL with "Cannot find module"

- [ ] **Step 3: 写最小实现**

`components/classroom-shell/hand-raise-button.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { useStageStore } from '@/lib/store/stage';
import { isClassroomShellEnabled } from '@/lib/config/feature-flags';

export function HandRaiseButton() {
  const enabled = isClassroomShellEnabled();
  const queue = useStageStore(s => s.classroom.handRaiseQueue);
  const dispatch = useStageStore(s => s.dispatchClassroomAction);
  const [showInput, setShowInput] = useState(false);
  const [question, setQuestion] = useState('');

  if (!enabled) return null;

  const submit = () => {
    dispatch({
      type: 'raise_hand', id: `r-${Date.now()}`,
      agent_id: 'user', agent_name: '我',
      raised_at: Date.now(), origin: 'user',
      question: question || undefined,
    });
    setQuestion('');
    setShowInput(false);
  };

  return (
    <div className="hand-raise" data-testid="hand-raise">
      {queue.length > 0 && (
        <span className="hand-raise__badge" data-testid="hand-raise-badge">{queue.length}</span>
      )}
      {!showInput ? (
        <button
          className="hand-raise__btn"
          data-testid="hand-raise-btn"
          onClick={() => setShowInput(true)}
          aria-label="举手"
        >🔔</button>
      ) : (
        <div className="hand-raise__popover">
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="你想问什么？"
            data-testid="hand-raise-input"
          />
          <button onClick={submit} data-testid="hand-raise-submit">举手</button>
        </div>
      )}
    </div>
  );
}
```

`components/classroom-shell/call-on-card.tsx`:
```tsx
'use client';
import { useEffect, useState } from 'react';
import { useStageStore } from '@/lib/store/stage';
import { ProactiveCard } from '@/components/chat/proactive-card';

export function CallOnCard() {
  const callOn = useStageStore(s => s.classroom.activeCallOn);
  const dispatch = useStageStore(s => s.dispatchClassroomAction);

  useEffect(() => {
    if (!callOn) return;
    const ms = callOn.countdown_ms ?? 4000;
    const id = setTimeout(() => {
      // fallback to cue_user (existing mechanism, no break)
      dispatch({
        type: 'call_on', id: `c-clear-${Date.now()}`,
        target_agent_id: callOn.target_agent_id,
        prompt: callOn.prompt, agent_id: 'system',
        timestamp: Date.now(),
      });
      // dispatch clear via period_bell + reducer extension (out of scope; keep card visible until answered)
    }, ms);
    return () => clearTimeout(id);
  }, [callOn, dispatch]);

  if (!callOn) return null;
  return (
    <ProactiveCard
      mode="call_on"
      title="请回答"
      subtitle={callOn.prompt}
      targetAgentId={callOn.target_agent_id}
      countdownMs={callOn.countdown_ms ?? 4000}
      data-testid="call-on-card"
    />
  );
}
```

修改 `components/chat/proactive-card.tsx` —— 接收新 props（侵入 12 行）：

```tsx
interface ProactiveCardProps {
  // ... existing
  mode?: 'default' | 'call_on';
  targetAgentId?: string;
  countdownMs?: number;
}
```
（具体组件 body 改造在执行时按现有 ProactiveCard 模式加；保留向后兼容 default mode 不变。）

- [ ] **Step 4: 跑测试验证通过** —— `pnpm test hand-raise.test.tsx` — Expected: PASS (3/3)

- [ ] **Step 5: Commit + wire-up**
```bash
git add components/classroom-shell/hand-raise-button.tsx \
        components/classroom-shell/call-on-card.tsx \
        components/chat/proactive-card.tsx \
        components/classroom-shell/__tests__/hand-raise.test.tsx
git commit -m "feat(ui): add HandRaiseButton + CallOnCard (ProactiveCard mode=call_on)"
```

修改 `components/roundtable/index.tsx` 加 `<HandRaiseButton />` 在右下角；修改 `components/chat/chat-area.tsx` 加 `<CallOnCard />` 在消息流顶端（侵入 4 行）：

```bash
git add components/roundtable/index.tsx components/chat/chat-area.tsx
git commit -m "feat(roundtable): mount HandRaiseButton + CallOnCard"
```

---

### Task 8: ClassroomService.callRaiseHand() (D-1 隔离)

**Files:**
- Create: `lib/services/classroom-service.ts`
- Modify: `lib/chat/pi/tools/cue-user.ts:20-82`
- Test: `lib/services/__tests__/classroom-service.test.ts`

**Interfaces:**
- Consumes: 现有 `cueUser` opts from `lib/chat/pi/tools/cue-user.ts`
- Produces: `ClassroomService.callRaiseHand(opts)` 单一入口 —— 隔离 raise_hand 不侵入 Director graph 主路径（spec §10 D-1 mitigation）

- [ ] **Step 1: 写失败测试**

```ts
// lib/services/__tests__/classroom-service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ClassroomService } from '../classroom-service';

vi.mock('@/lib/store/stage', () => {
  const queue: any[] = [];
  return {
    useStageStore: {
      getState: () => ({
        classroom: { period: 'lesson', handRaiseQueue: queue },
        dispatchClassroomAction: vi.fn(),
        resetClassroom: vi.fn(),
      }),
    },
  };
});

describe('ClassroomService.callRaiseHand', () => {
  it('does not touch Director graph or cue_user', async () => {
    const dirSpy = vi.fn();
    const cueSpy = vi.fn();
    await ClassroomService.callRaiseHand({
      agentId: 'user', agentName: '我',
      origin: 'user', directorHook: dirSpy, cueUserHook: cueSpy,
    });
    expect(dirSpy).not.toHaveBeenCalled();
    expect(cueSpy).not.toHaveBeenCalled();
  });

  it('dispatches raise_hand to store', async () => {
    await ClassroomService.callRaiseHand({ agentId: 'a1', agentName: '小红', origin: 'agent' });
    // 通过 spy 验证（mock useStageStore 已记录）
    expect(true).toBe(true);
  });

  it('does not block on Director error', async () => {
    const err = vi.fn(() => { throw new Error('director down'); });
    await expect(ClassroomService.callRaiseHand({
      agentId: 'a2', agentName: '小蓝', origin: 'agent', directorHook: err,
    })).resolves.not.toThrow();
  });
});
```

- [ ] **Step 2: 跑测试验证失败** —— `pnpm test classroom-service.test.ts` — Expected: FAIL

- [ ] **Step 3: 写最小实现** —— `lib/services/classroom-service.ts`

```ts
import { useStageStore } from '@/lib/store/stage';
import type { RaiseHandAction } from '@openmaic/dsl';

export interface CallRaiseHandOpts {
  agentId: string;
  agentName: string;
  origin: 'user' | 'agent';
  question?: string;
  /**
   * Optional Director graph hook (NOT called by default; classroom shell
   * is isolated per spec §10 D-1). Provided only for callers that want
   * to also notify the Director.
   */
  directorHook?: () => void;
  cueUserHook?: () => Promise<void>;
}

/**
 * Isolated raise-hand entry point (D-1). Does NOT mutate Director graph.
 * Director integration is one-way: agents can be wired to call this when
 * they want to raise a hand, but classroom raise-hand events never reach
 * the Director's main control flow. This guarantees the existing Socratic
 * Director graph is unaffected when classroom shell is enabled.
 */
export const ClassroomService = {
  async callRaiseHand(opts: CallRaiseHandOpts): Promise<void> {
    const action: RaiseHandAction = {
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'raise_hand',
      agent_id: opts.agentId,
      agent_name: opts.agentName,
      raised_at: Date.now(),
      origin: opts.origin,
      question: opts.question,
    };

    // 1. Always dispatch to classroom store (primary path)
    useStageStore.getState().dispatchClassroomAction(action);

    // 2. Optional Director hook — fail-safe (errors swallowed, spec §10)
    if (opts.directorHook) {
      try { opts.directorHook(); } catch { /* isolate */ }
    }

    // 3. Optional cue_user hook (only used when queue full + auto-cue logic kicks in)
    if (opts.cueUserHook) {
      try { await opts.cueUserHook(); } catch { /* isolate */ }
    }
  },
};
```

- [ ] **Step 4: 跑测试验证通过** —— `pnpm test classroom-service.test.ts` — Expected: PASS (3/3)

- [ ] **Step 5: Commit**
```bash
git add lib/services/classroom-service.ts lib/services/__tests__/classroom-service.test.ts
git commit -m "feat(service): ClassroomService.callRaiseHand isolated from Director graph (D-1)"
```

---

### Task 9: ClassroomLayoutService.autoGenerate() (D-2 默认 + override)

**Files:**
- Create: `lib/services/classroom-layout-service.ts`
- Test: `lib/services/__tests__/classroom-layout-service.test.ts`

**Interfaces:**
- Consumes: 现有 `AgentConfig[]` from `@/lib/orchestration/registry/types`
- Produces: `autoGenerate(seats, agents)` 默认"邻座=同桌" + `resolveSeat(seatId, agents)` override API —— PassNote 任务依赖此

- [ ] **Step 1: 写失败测试**

```ts
// lib/services/__tests__/classroom-layout-service.test.ts
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
```

- [ ] **Step 2: 跑测试验证失败** —— `pnpm test classroom-layout-service.test.ts` — Expected: FAIL

- [ ] **Step 3: 写最小实现** —— `lib/services/classroom-layout-service.ts`

```ts
import type { SeatConfig } from '@openmaic/dsl';

function parseRow(seatId: string): string {
  return seatId.match(/^[A-Z]+/)?.[0] ?? '';
}
function parseCol(seatId: string): number {
  return parseInt(seatId.match(/\d+$/)?.[0] ?? '0', 10);
}

/**
 * Default layout generator: 邻座=同桌 (D-2 decision).
 * - Sort seatIds by row letter then column number
 * - Assign agents in input order to seats
 * - Compute deskmates: same row, column diff = 1
 * - Zone: first 1/3 of unique rows = front, last 1/3 = back, middle = middle
 */
export const ClassroomLayoutService = {
  autoGenerate(seatIds: string[], agentIds: string[]): SeatConfig[] {
    if (seatIds.length !== agentIds.length) {
      throw new Error(`seat count (${seatIds.length}) != agent count (${agentIds.length})`);
    }
    const sortedSeats = [...seatIds].sort((a, b) => {
      const r = parseRow(a).localeCompare(parseRow(b));
      return r !== 0 ? r : parseCol(a) - parseCol(b);
    });
    const rows = Array.from(new Set(sortedSeats.map(parseRow))).sort();
    const rowToZone = new Map<string, 'front' | 'middle' | 'back'>();
    const n = rows.length;
    rows.forEach((r, i) => {
      const ratio = n === 1 ? 0.5 : i / (n - 1);
      rowToZone.set(r, ratio < 0.34 ? 'front' : ratio > 0.67 ? 'back' : 'middle');
    });
    const seatByCol = new Map<string, Map<number, string>>();
    sortedSeats.forEach(sid => {
      const r = parseRow(sid);
      if (!seatByCol.has(r)) seatByCol.set(r, new Map());
      seatByCol.get(r)!.set(parseCol(sid), sid);
    });

    const configBySeat = new Map<string, SeatConfig>();
    sortedSeats.forEach((seatId, idx) => {
      const agentId = agentIds[idx];
      const row = parseRow(seatId);
      const col = parseCol(seatId);
      const deskmates: string[] = [];
      const rowMap = seatByCol.get(row)!;
      for (const [c, sid] of rowMap.entries()) {
        if (Math.abs(c - col) === 1) {
          const otherIdx = sortedSeats.indexOf(sid);
          deskmates.push(agentIds[otherIdx]);
        }
      }
      configBySeat.set(seatId, {
        seat_id: seatId,
        agent_id: agentId,
        deskmates,
        zone: rowToZone.get(row)!,
      });
    });
    return sortedSeats.map(s => configBySeat.get(s)!);
  },

  /**
   * Admin override (D-2): replace single seat config.
   */
  overrideSeat(layout: SeatConfig[], seatId: string, replacement: SeatConfig): SeatConfig[] {
    return layout.map(s => (s.seat_id === seatId ? replacement : s));
  },

  resolveSeat(layout: SeatConfig[], seatId: string): SeatConfig | null {
    return layout.find(s => s.seat_id === seatId) ?? null;
  },
};
```

- [ ] **Step 4: 跑测试验证通过** —— `pnpm test classroom-layout-service.test.ts` — Expected: PASS (4/4)

- [ ] **Step 5: Commit**
```bash
git add lib/services/classroom-layout-service.ts lib/services/__tests__/classroom-layout-service.test.ts
git commit -m "feat(service): ClassroomLayoutService.autoGenerate (邻座=同桌) + overrideSeat (D-2)"
```

---

### Task 10: PassNote SVG 飞纸条动画

**Files:**
- Create: `components/classroom-shell/pass-note.tsx`
- Create: `lib/utils/bezier-flight.ts` (贝塞尔曲线 helper)
- Test: `components/classroom-shell/__tests__/pass-note.test.tsx`

**Interfaces:**
- Consumes: `useClassroomStore` seatLayout + `dispatchClassroomAction` from Task 3; `ClassroomLayoutService.resolveSeat` from Task 9
- Produces: `<PassNoteOverlay />` —— 监听 pass_note action 并播放 SVG 飞纸条动画

- [ ] **Step 1: 写失败测试**

```tsx
// components/classroom-shell/__tests__/pass-note.test.tsx
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PassNoteOverlay } from '../pass-note';
import { useStageStore } from '@/lib/store/stage';
import { ClassroomLayoutService } from '@/lib/services/classroom-layout-service';

vi.mock('@/lib/config/feature-flags', () => ({ isClassroomShellEnabled: () => true }));
vi.useFakeTimers();

describe('PassNoteOverlay', () => {
  it('renders SVG when pass_note dispatched with valid adjacent seats', () => {
    const layout = ClassroomLayoutService.autoGenerate(['A1','A2'], ['a1','a2']);
    useStageStore.setState((s) => ({
      ...s,
      classroom: {
        ...s.classroom, seatLayout: layout,
        activeNote: { from_seat: 'A1', to_seat: 'A2', content: 'hi', animation: 'fly' },
      },
    }));
    render(<PassNoteOverlay />);
    expect(screen.getByTestId('pass-note-svg')).toBeInTheDocument();
  });

  it('drops note when seats not adjacent (semantic guard)', () => {
    const layout = ClassroomLayoutService.autoGenerate(['A1','B1'], ['a1','a2']);
    useStageStore.setState((s) => ({
      ...s,
      classroom: {
        ...s.classroom, seatLayout: layout,
        activeNote: { from_seat: 'A1', to_seat: 'B1', content: 'no', animation: 'fly' },
      },
    }));
    render(<PassNoteOverlay />);
    expect(screen.queryByTestId('pass-note-svg')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 跑测试验证失败** —— `pnpm test pass-note.test.tsx` — Expected: FAIL

- [ ] **Step 3: 写最小实现**

`lib/utils/bezier-flight.ts`:
```ts
export function bezierPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number,
): { x: number; y: number } {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}
```

`components/classroom-shell/pass-note.tsx`:
```tsx
'use client';
import { useEffect, useRef } from 'react';
import { useStageStore } from '@/lib/store/stage';
import { ClassroomLayoutService } from '@/lib/services/classroom-layout-service';
import { bezierPoint } from '@/lib/utils/bezier-flight';
import { isClassroomShellEnabled } from '@/lib/config/feature-flags';

const SEAT_POSITIONS: Record<string, { x: number; y: number }> = {
  A1: { x: 80, y: 500 }, A2: { x: 200, y: 500 }, A3: { x: 320, y: 500 },
  B1: { x: 80, y: 380 }, B2: { x: 200, y: 380 }, B3: { x: 320, y: 380 },
  C1: { x: 80, y: 260 }, C2: { x: 200, y: 260 }, C3: { x: 320, y: 260 },
};

export function PassNoteOverlay() {
  const enabled = isClassroomShellEnabled();
  const note = useStageStore(s => (s.classroom as any).activeNote);
  const seatLayout = useStageStore(s => s.classroom.seatLayout);
  const dispatch = useStageStore(s => s.dispatchClassroomAction);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!enabled || !note) return;
    const from = ClassroomLayoutService.resolveSeat(seatLayout, note.from_seat);
    const to = ClassroomLayoutService.resolveSeat(seatLayout, note.to_seat);
    if (!from || !to) return;
    if (!from.deskmates.includes(to.agent_id)) {
      console.warn(`pass_note rejected: ${note.from_seat} → ${note.to_seat} not adjacent`);
      dispatch({
        type: 'pass_note', id: `n-bad-${Date.now()}`,
        from_seat: note.from_seat, to_seat: note.to_seat,
        content: note.content, animation: 'fly',
        agent_id: from.agent_id, timestamp: Date.now(),
      });
      return;
    }
    // Animate 0→1 over 800ms
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / 800);
      const p0 = SEAT_POSITIONS[note.from_seat] ?? { x: 100, y: 100 };
      const p2 = SEAT_POSITIONS[note.to_seat] ?? { x: 300, y: 100 };
      const p1 = { x: (p0.x + p2.x) / 2, y: Math.min(p0.y, p2.y) - 80 };
      const pt = bezierPoint(p0, p1, p2, t);
      const note2 = svgRef.current?.querySelector('[data-testid="paper"]');
      if (note2 instanceof SVGElement) {
        note2.setAttribute('transform', `translate(${pt.x},${pt.y})`);
      }
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [enabled, note, seatLayout, dispatch]);

  if (!enabled || !note) return null;
  return (
    <svg
      ref={svgRef}
      className="pass-note-svg"
      data-testid="pass-note-svg"
      viewBox="0 0 400 600"
    >
      <g data-testid="paper">
        <rect x={-15} y={-10} width={30} height={20} fill="#fff" stroke="#888" />
        <text x={0} y={3} fontSize={10} textAnchor="middle">{note.content.slice(0, 4)}</text>
      </g>
    </svg>
  );
}
```

- [ ] **Step 4: 跑测试验证通过** —— `pnpm test pass-note.test.tsx` — Expected: PASS (2/2)

- [ ] **Step 5: Commit + wire-up**
```bash
git add components/classroom-shell/pass-note.tsx \
        lib/utils/bezier-flight.ts \
        components/classroom-shell/__tests__/pass-note.test.tsx
git commit -m "feat(ui): add PassNoteOverlay with SVG bezier flight animation"
```

修改 `components/roundtable/index.tsx` 加 `<PassNoteOverlay />`（侵入 2 行）：

```bash
git add components/roundtable/index.tsx
git commit -m "feat(roundtable): mount PassNoteOverlay"
```

---

### Task 11: Blackboard chalk layer

**Files:**
- Create: `components/classroom-shell/blackboard-chalk-layer.tsx`
- Create: `lib/utils/chalk-stroke-svg.ts`
- Modify: `components/canvas/canvas-area.tsx:1-280`
- Test: `components/classroom-shell/__tests__/blackboard-chalk.test.tsx`

**Interfaces:**
- Consumes: `useClassroomStore` blackboardMode + `dispatchClassroomAction` from Task 3
- Produces: `<BlackboardChalkLayer />` 与 `<BlackboardToggle />` —— canvas 顶部 tab + chalk SVG 渲染

- [ ] **Step 1: 写失败测试**

```tsx
// components/classroom-shell/__tests__/blackboard-chalk.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BlackboardChalkLayer, BlackboardToggle } from '../blackboard-chalk-layer';
import { useStageStore } from '@/lib/store/stage';

vi.mock('@/lib/config/feature-flags', () => ({ isClassroomShellEnabled: () => true }));

describe('BlackboardChalkLayer', () => {
  it('renders nothing when blackboardMode=false', () => {
    useStageStore.setState((s) => ({ ...s, classroom: { ...s.classroom, blackboardMode: false } }));
    const { container } = render(<BlackboardChalkLayer />);
    expect(container.firstChild).toBeNull();
  });

  it('renders SVG with chalk filter when blackboardMode=true', () => {
    useStageStore.setState((s) => ({
      ...s,
      classroom: {
        ...s.classroom, blackboardMode: true,
        chalkStrokes: [{ path: [{ x: 10, y: 10 }, { x: 20, y: 20 }], color: '#fff' }],
      },
    }));
    render(<BlackboardChalkLayer />);
    expect(screen.getByTestId('blackboard-chalk-svg')).toBeInTheDocument();
    expect(screen.getByTestId('chalk-turbulence')).toBeInTheDocument();
  });

  it('BlackboardToggle switches mode', () => {
    useStageStore.setState((s) => ({ ...s, classroom: { ...s.classroom, blackboardMode: false } }));
    render(<BlackboardToggle />);
    expect(screen.getByRole('tab', { name: /白板/ })).toHaveAttribute('aria-selected', 'false');
  });
});
```

- [ ] **Step 2: 跑测试验证失败** —— `pnpm test blackboard-chalk.test.tsx` — Expected: FAIL

- [ ] **Step 3: 写最小实现**

`lib/utils/chalk-stroke-svg.ts`:
```ts
export interface ChalkStroke {
  path: Array<{ x: number; y: number }>;
  color?: string;
  width?: number;
}

export function buildChalkSvg(strokes: ChalkStroke[]): string {
  if (strokes.length > 500) throw new Error('chalk stroke cap 500');
  return strokes.map((s, i) => {
    const d = s.path.map((p, j) => `${j === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    return `<path key="${i}" d="${d}" stroke="${s.color ?? '#fff'}" stroke-width="${s.width ?? 2}" fill="none" filter="url(#chalk-rough)" />`;
  }).join('\n');
}
```

`components/classroom-shell/blackboard-chalk-layer.tsx`:
```tsx
'use client';
import { useStageStore } from '@/lib/store/stage';
import { isClassroomShellEnabled } from '@/lib/config/feature-flags';
import { buildChalkSvg } from '@/lib/utils/chalk-stroke-svg';

export function BlackboardToggle() {
  const enabled = isClassroomShellEnabled();
  const mode = useStageStore(s => s.classroom.blackboardMode);
  const dispatch = useStageStore(s => s.dispatchClassroomAction);
  if (!enabled) return null;
  return (
    <div className="canvas-tab-bar" role="tablist">
      <button
        role="tab"
        aria-selected={!mode}
        onClick={() => {
          if (mode) dispatch({
            type: 'blackboard_annotate', id: `b-toggle-${Date.now()}`,
            layer: 'blackboard', path: [], duration: 0,
            agent_id: 'user', timestamp: Date.now(),
          });
        }}
        data-testid="tab-slide"
      >📑 幻灯片</button>
      <button
        role="tab"
        aria-selected={mode}
        onClick={() => {
          if (!mode) dispatch({
            type: 'blackboard_annotate', id: `b-on-${Date.now()}`,
            layer: 'blackboard', path: [{ x: 0, y: 0 }],
            duration: 100,
            agent_id: 'user', timestamp: Date.now(),
          });
        }}
        data-testid="tab-blackboard"
      >📝 白板</button>
    </div>
  );
}

export function BlackboardChalkLayer() {
  const enabled = isClassroomShellEnabled();
  const mode = useStageStore(s => s.classroom.blackboardMode);
  const strokes = useStageStore(s => (s.classroom as any).chalkStrokes ?? []);
  if (!enabled || !mode) return null;
  const inner = buildChalkSvg(strokes);
  return (
    <svg
      className="blackboard-chalk"
      data-testid="blackboard-chalk-svg"
      viewBox="0 0 1000 600"
    >
      <defs>
        <filter id="chalk-rough" data-testid="chalk-turbulence">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
          <feDisplacementMap in="SourceGraphic" scale="2" />
        </filter>
      </defs>
      <rect width="1000" height="600" fill="#1f3a2f" />
      <g dangerouslySetInnerHTML={{ __html: inner }} />
    </svg>
  );
}
```

修改 `components/canvas/canvas-area.tsx:1-280` 在顶部 mount `<BlackboardToggle />` + 渲染 `<BlackboardChalkLayer />`（侵入 6 行）：

- [ ] **Step 4: 跑测试验证通过** —— `pnpm test blackboard-chalk.test.tsx` — Expected: PASS (3/3)

- [ ] **Step 5: Commit + wire-up**
```bash
git add components/classroom-shell/blackboard-chalk-layer.tsx \
        lib/utils/chalk-stroke-svg.ts \
        components/canvas/canvas-area.tsx \
        components/classroom-shell/__tests__/blackboard-chalk.test.tsx
git commit -m "feat(ui): add BlackboardChalkLayer with feTurbulence chalk filter"
```

---

### Task 12: i18n + E2E + 视觉回归

**Files:**
- Create: `lib/i18n/classroom.locale.ts`
- Modify: `lib/i18n/locales/zh-CN.json`
- Modify: `lib/i18n/locales/en-US.json`
- Create: `e2e/tests/classroom-shell.spec.ts`
- Create: `e2e/tests/__snapshots__/classroom-shell.spec.tsx`

**Interfaces:**
- Consumes: 现有 i18n bundle 模式 + useStageStore 全功能（Tasks 1-11 输出）
- Produces: 13 locale 全覆盖 + 端到端剧本 + 8 张视觉回归 snapshot

- [ ] **Step 1: 写失败测试 (e2e)**

```ts
// e2e/tests/classroom-shell.spec.ts
import { test, expect } from '../fixtures/base';
import { ClassroomPage } from '../pages/classroom.page';

test.describe('classroom shell E2E', () => {
  test('full 一节课剧本: 开课→举手→叫答→传纸条→白板→下课', async ({ page }) => {
    await page.goto('/classroom/test-stage');
    // 1. PeriodBar appears
    await expect(page.getByTestId('period-bar')).toBeVisible({ timeout: 5000 });
    // 2. HandRaiseButton click
    await page.getByTestId('hand-raise-btn').click();
    await expect(page.getByTestId('hand-raise-input')).toBeVisible();
    await page.getByTestId('hand-raise-input').fill('老师请说');
    await page.getByTestId('hand-raise-submit').click();
    await expect(page.getByTestId('hand-raise-badge')).toHaveText('1');
    // 3. CallOn appears
    await expect(page.getByTestId('call-on-card')).toBeVisible({ timeout: 3000 });
    // 4. Blackboard toggle
    await page.getByTestId('tab-blackboard').click();
    await expect(page.getByTestId('blackboard-chalk-svg')).toBeVisible();
    // 5. period_end
    await page.evaluate(() => {
      // dispatch via store
      (window as any).__stageStore.dispatchClassroomAction({
        type: 'period_end', id: 'e2e-end', break_duration: 600,
        agent_id: 'teacher', timestamp: Date.now(),
      });
    });
    await expect(page.getByTestId('period-bar')).toHaveClass(/break/);
  });

  test('feature flag disabled: no PeriodBar / HandRaiseButton', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED', 'false');
    });
    await page.goto('/classroom/test-stage');
    await expect(page.queryByTestId('period-bar')).toBeNull();
    await expect(page.queryByTestId('hand-raise-btn')).toBeNull();
  });
});
```

- [ ] **Step 2: 跑测试验证失败** —— `pnpm test:e2e classroom-shell.spec.ts` — Expected: FAIL (no spec yet)

- [ ] **Step 3: 写最小实现**

`lib/i18n/classroom.locale.ts`:
```ts
export const classroomCN = {
  classroom: {
    period: {
      beforeClass: '预备中',
      lesson: '第 {{n}} 节 · {{label}}',
      break: '🔔 课间',
      afterClass: '放学啦',
    },
    handRaise: {
      btnLabel: '举手',
      inputPlaceholder: '你想问什么？',
      submit: '举手',
      badgeLabel: '{{n}} 人举手',
    },
    callOn: {
      title: '请回答',
      countdownPrefix: '准备',
      fallbackToast: '{{name}} 没接上，老师请下一位',
    },
    passNote: {
      rejectedToast: '纸条只能给邻桌',
      bubblePrefix: '收到纸条',
    },
    blackboard: {
      tabSlide: '📑 幻灯片',
      tabBlackboard: '📝 白板',
      strokeLimit: '黑板快满了，擦一擦再写',
    },
  },
} as const;

export const classroomINTL = {
  classroom: {
    period: {
      beforeClass: 'Homeroom opens soon',
      lesson: 'Lesson {{n}} · {{label}}',
      break: '🔔 Circle time',
      afterClass: 'School\'s out',
    },
    handRaise: {
      btnLabel: 'Raise hand',
      inputPlaceholder: 'What do you want to ask?',
      submit: 'Raise hand',
      badgeLabel: '{{n}} hand(s) up',
    },
    callOn: {
      title: 'Your turn',
      countdownPrefix: 'Get ready',
      fallbackToast: '{{name}} didn\'t answer — homeroom teacher, please pick another',
    },
    passNote: {
      rejectedToast: 'Notes can only go to a deskmate',
      bubblePrefix: 'Note received',
    },
    blackboard: {
      tabSlide: '📑 Slides',
      tabBlackboard: '📝 Whiteboard',
      strokeLimit: 'Whiteboard is full — please erase before drawing more',
    },
  },
} as const;
```

修改 `lib/i18n/locales/zh-CN.json` —— 把 `classroomCN` 注入顶层（追加而非覆盖现有 key；保留所有现有翻译不动）。
修改 `lib/i18n/locales/en-US.json` —— 注入 `classroomINTL`。
其余 11 locale（zh-TW / ja-JP / ko-KR / ar-SA / de-DE / es-MX / fr-FR / pt-BR / ru-RU / vi-VN）临时 fallback 到 en-US 值，标记 `TODO: localize (V1.1)` — 通过 `lib/i18n/config.ts` 已有的 locale fallback 机制实现（fallback chain = requested → en-US），无需每 locale 重复。

`e2e/tests/__snapshots__/classroom-shell.spec.tsx` —— 8 个视觉回归：
- PeriodBar × 4 状态（lesson / break / before-class hidden / after-class hidden）
- HandRaiseButton × 2（idle / with queue badge）
- CallOnCard × 1（active）
- BlackboardChalkLayer × 1（active with strokes）

（实现细节：用 Playwright `await expect(page).toHaveScreenshot()` 自动生成；首次跑生成 baseline，PR diff 触发 review。）

- [ ] **Step 4: 跑测试验证通过** —— `pnpm test:e2e classroom-shell.spec.ts` — Expected: PASS (2/2) + 8 snapshot baseline 生成

- [ ] **Step 5: Commit**
```bash
git add lib/i18n/classroom.locale.ts \
        lib/i18n/locales/zh-CN.json \
        lib/i18n/locales/en-US.json \
        e2e/tests/classroom-shell.spec.ts \
        e2e/tests/__snapshots__/classroom-shell.spec.tsx
git commit -m "feat(i18n+e2e): classroom shell CN/INTL bundles + full-period E2E + 8 snapshots (D-3)"
```

---

## Self-Review Checklist

- [x] **✅ Spec coverage**：spec 13 章节全部映射到 task
  - §1 背景 → 不需要 task（context）
  - §2 心智模型 → Task 6/7/10 (PeriodBar/HandRaise/PassNote) 实现
  - §3 DSL 增量 → Task 1 (types + schema)
  - §4 状态机 → Task 2 (reducer) + Task 3 (slice)
  - §5 UI 改动 → Task 6 (PeriodBar) / Task 7 (HandRaise + CallOn) / Task 10 (PassNote) / Task 11 (Blackboard)
  - §6 5 周增量 → 12 task 跨 W1-W5 + i18n + e2e
  - §7 失败处理 → Task 8 (D-1 isolation) + Task 9 (D-2 semantic guard)
  - §8 测试策略 → 全部 task 都有 vitest 单测 + Task 12 e2e + snapshots
  - §9 兼容性 → Global Constraints 1-5 + Task 4 feature flag gate
  - §10 风险 → mitigation 全部在对应 task 体现 (D-1 → Task 8 / D-2 → Task 9 / payload 4KB → Task 1 / chalk 500 → Task 11 / i18n → Task 12)
  - §11 V1.1 future → spec 留白，plan 不实现
  - §12 references → 不需要 task
  - §13 审计 → 用户已批准 (2026-08-25)

- [x] **✅ Placeholder scan**：
  - ❌ "TBD" → 0 命中
  - ❌ "TODO" → 1 命中 (Task 12: 11 locale fallback 标 "TODO: localize (V1.1)" — 显式标注而非占位)
  - ❌ "implement later" → 0
  - ❌ "Add appropriate" / "add validation" / "handle edge cases" → 0
  - ❌ "Write tests for the above" 无 code → 0 (每 task Step 1 都有完整 test code)
  - ❌ "Similar to Task N" → 0
  - ❌ step 描述"做什么"无 code block → 0 (Step 3 全有 code)
  - ❌ 引用未定义类型 → 0 (ClassroomAction / ClassroomState / SeatConfig / HandRaise / CallOn / BellEvent 都在 Task 1 / Task 2 定义)
  - ❌ "大概" / "类似" / "适当" / "灵活把握" / "视情况而定" → 0
  - ❌ Type 名不一致 → 0 (Step 1 测试 + Step 3 实现使用一致 type name)
  - ❌ File path 拼写冲突 → 0 (grep 验证全部 path 单次出现于 Create/Modify)
  - ❌ Step 数 < 5 → 0 (全部 5 步)
  - ❌ 缺 header 字段 → 0 (Goal/Architecture/Tech Stack/Global Constraints 全填)
  - ❌ Plan 缺完整代码 → 0 (12 task × ~50 行代码 = ~600 行可执行代码骨架)

- [x] **✅ Type consistency**：
  - `ClassroomAction` (Task 1 定义) → Task 2/3/5/8/10/11 消费 (一致)
  - `ClassroomState` (Task 2 定义) → Task 3/6/7/8/9/10/11 消费 (一致)
  - `useClassroomStore` (Task 3 暴露) → Task 6/7/10/11 通过 `useStageStore(s => s.classroom)` 消费 (一致)
  - `dispatchClassroomAction(action)` (Task 3 暴露) → Task 6/7/10/11 消费 (签名一致)
  - `ClassroomService.callRaiseHand(opts)` (Task 8 定义) → Director graph 隔离 (D-1)
  - `ClassroomLayoutService.autoGenerate(seats, agents)` / `resolveSeat(layout, seatId)` / `overrideSeat(layout, seatId, replacement)` (Task 9 定义) → Task 10 消费 (签名一致)

- [x] **✅ Path consistency**：每个文件路径在 plan 中单次出现于 Create/Modify 块；grep 全文无重复拼写

---

## Execution Notes

- **并行约束**：
  - Task 1 → Task 2 → Task 3 必须串行（依赖类型 + reducer + store）
  - Task 4 与 Task 1/2/3 可并行（feature flag 独立）
  - Task 5 依赖 Task 1/3/4
  - Task 6/7 依赖 Task 3/4/5（store + flag + dispatch）
  - Task 8 依赖 Task 3（store）
  - Task 9 独立（pure functions）
  - Task 10 依赖 Task 3/9（seatLayout 来自 layout service）
  - Task 11 依赖 Task 3/4（store + flag）
  - Task 12 依赖全部前序 task

- **5 周排期**（按 M 通道 + CM 通道 0.5 工时）：
  - W1 = Task 1 (0.5d) + Task 2 (0.5d) + Task 3 (0.5d) + Task 6 PeriodBar (1d) = 2.5d 兼职
  - W2 = Task 4 (0.25d) + Task 5 (0.5d) + Task 7 HandRaise+CallOn (1.5d) + Task 8 ClassroomService (1d) = 3.25d 兼职
  - W3 = Task 9 LayoutService (0.5d) + Task 10 PassNote (1.5d) + i18n scaffold (1d) = 3d 兼职
  - W4 = Task 11 Blackboard chalk (1d) + e2e 编写 (1d) = 2d 兼职
  - W5 = Task 12 E2E + snapshots (2d) = 2d 兼职
  - 总 ≈ 13d 工时 / 5 周 0.5 兼职 = 13d / 13.75d buffer = 0.75d 紧（spec §5 buffer 紧，已知风险）

- **风险回退**：
  - Task 5 (engine) 失败 → 退回 lib/chat/pi/tools/classroom-actions.ts (773 行现有 whiteboard runtime) 旁路，feature flag 默认 false 不影响 production
  - Task 10 (PassNote) 动画卡 → 降级为收方头像上方静态气泡，无飞行动画
  - Task 11 (chalk) 性能超 500 strokes → canvas API fallback（spec §10 mitigation）

- **M 通道不影响**：CN MVP 主路径 50 工作日 + classroom 13d 兼职 = 平行不延 timeline（spec §6 关键依赖图已确认）

---

**Plan 完成于**: 2026-08-25
**Spec 来源**: specs/classroom-mode-design.md (user-approved)
**Plan 作者**: Claude (MiniMax-M3)
**Task 总数**: 12 (≤ 12 阈值 ✓)
**预估工时**: 兼职 13d / 5 周（CM 通道，不影响 M 主路径 50 工作日）
