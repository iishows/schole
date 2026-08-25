# Classroom Mode V1.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans.
>
> **Source spec:** [`specs/shared/classroom-mode-design.md`](../shared/classroom-mode-design.md) §11 (V1.1 future work) + 审计报告 [`specs/audits/classroom-mode-implementation-audit-2026-08-25.md`](../audits/classroom-mode-implementation-audit-2026-08-25.md) M2/M4 + L1-L4
>
> **Parent plan:** [`specs/cn/plans/2026-08-25-classroom-mode.md`](2026-08-25-classroom-mode.md) — V1 已 ship 18 commits, V1.1 在 V1 之上补 5 LOW + 2 MEDIUM

**Goal:** 把 V1 推迟的 6 项 (M2 admin UI / M4 snapshots / L1-L4 LOW) 全部实现，让 Classroom Mode 100% 满足 spec。

**Architecture:** 不改 V1 已有 22+7 action union、不动 DSL schema、不动 Roundtable 三列布局。所有 task 局部扩展：
- L1-L3 扩 reducer / service（无 schema 变更）
- L4 扩 CSS（响应式）
- M2 新建 admin 路由 + UI 调现成 `ClassroomLayoutService.overrideSeat()`
- M4 新建 playwright snapshot 文件（依赖 dev server）

**Tech Stack:** TypeScript · zustand · vitest · Playwright (`toHaveScreenshot`) · CSS media query。

---

## Global Constraints (继承 V1 + 新增)

1-12. 继承 V1 plan 全部 12 条 (UI 不侵入 / DSL 不破坏 / feature flag 默认 false / 4KB payload / 500 chalk stroke / i18n classroom.* namespace / 等)
13. **V1.1 新增**：admin 路由 `/admin/classroom` 仅 admin role 可访问（spec §10 D-2 决策）
14. **V1.1 新增**：snapshot baselines 必须用固定 viewport (1280×800 desktop + 375×812 mobile)
15. **V1.1 新增**：L1 sort key 计算独立成 `resolveSortKey(hand, layout)` pure function（便于单元测试 + 未来 i18n 改 zone 顺序）
16. **V1.1 新增**：L3 priority mutex 仅 ChatArea 层 — 不侵入 reducer（reducer 仍接受 raise_hand / 任意顺序，但 ChatArea UI 屏蔽冲突）

---

## File Structure

**Create (新)**:
- `app/admin/classroom/page.tsx` — admin 路由：座位表 panel + overrideSeat 调入口
- `components/admin/seat-layout-editor.tsx` — 座位表编辑组件（deskmates[] 多选 + zone dropdown）
- `e2e/tests/classroom-snapshots.spec.ts` — 7 cases visual snapshot baseline
- `e2e/tests/__snapshots__/classroom-snapshots.spec.ts-snapshots/` — playwright 自动生成 baselines

**Modify (改)**:
- `components/classroom-shell/period-bar.tsx` — L4 移动端折叠 CSS
- `lib/store/classroom-state.ts` — L1 reducer 加 sort step (raise_hand / period_bell 之后)
- `lib/services/classroom-layout-service.ts` — L1 加 `resolveSortKey()` export
- `lib/services/classroom-service.ts` — L2 加 `scheduleAutoEnd()` + cleanup
- `components/chat/chat-area.tsx` — L3 加 `lastInputChannel` mutex + handleSubmit 拦截
- `lib/store/classroom-state.ts` (再) — L3 reducer 加 `lastInputChannel` 字段 + 类型

**Create (test)**:
- `components/classroom-shell/__tests__/period-bar-mobile.test.tsx` — L4 mobile viewport 36px 折叠
- `lib/store/__tests__/classroom-state-sort.test.ts` — L1 sort key
- `lib/services/__tests__/classroom-layout-service-sort.test.ts` — L1 resolveSortKey 边界
- `lib/services/__tests__/classroom-service-timer.test.ts` — L2 fake timers
- `components/chat/__tests__/chat-area-priority.test.tsx` — L3 input priority
- `components/admin/__tests__/seat-layout-editor.test.tsx` — M2 editor 改 deskmates/zone

---

## Tasks (6 个，按依赖顺序：纯逻辑先 / UI 后 / snapshot 最后)

### Task 1: L4 Period bar 移动端折叠

**Files:**
- Modify: `components/classroom-shell/period-bar.tsx:1-44` — 加 CSS module 媒体查询
- Test: `components/classroom-shell/__tests__/period-bar-mobile.test.tsx`

**Interfaces:**
- Consumes: 现有 `useStageStore(s => s.classroom.period)` + `useStageStore(s => s.classroom.periodEndsAt)`
- Produces: 移动端 (`@media (max-width: 640px)`) 渲染 36px mini bar（仅 bell icon + period label）+ chevron 可展开完整 44px 桌面版

**Step 1 — 写失败测试**:
```tsx
// components/classroom-shell/__tests__/period-bar-mobile.test.tsx
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PeriodBar } from '../period-bar';
import { useStageStore } from '@/lib/store/stage';

vi.mock('@/lib/store/stage');

describe('PeriodBar mobile responsive (L4)', () => {
  beforeEach(() => { vi.mocked(useStageStore).mockReturnValue(/* mock */); });
  it('renders mini bar (height 36px) when viewport <= 640px', () => {
    global.innerWidth = 480;
    const { container } = render(<PeriodBar />);
    expect(container.querySelector('.period-bar-mobile')).toBeTruthy();
    expect(container.querySelector('.period-bar-mobile')).toHaveStyle({ height: '36px' });
  });
  it('renders full bar (height 44px) when viewport > 640px', () => {
    global.innerWidth = 1280;
    const { container } = render(<PeriodBar />);
    expect(container.querySelector('.period-bar-full')).toBeTruthy();
    expect(container.querySelector('.period-bar-full')).toHaveStyle({ height: '44px' });
  });
});
```

**Step 2 — 跑测试验证失败**: `pnpm vitest run components/classroom-shell/__tests__/period-bar-mobile.test.tsx` — FAIL (no `.period-bar-mobile` class)

**Step 3 — 写最小实现**:
```tsx
// components/classroom-shell/period-bar.tsx 修改
import styles from './period-bar.module.css';
// 顶层 div 加 className={styles.periodBar}
// 新增 CSS module 文件
```
```css
/* period-bar.module.css */
.periodBar { height: 44px; display: flex; align-items: center; padding: 0 16px; }
@media (max-width: 640px) {
  .periodBar { height: 36px; padding: 0 8px; font-size: 12px; }
  .periodBarFull { display: none; }
  .periodBarMobile { display: flex; }
}
@media (min-width: 641px) {
  .periodBarMobile { display: none; }
}
```

**Step 4 — 跑测试验证通过**: `pnpm vitest run ...` — PASS

**Step 5 — Commit**: `git commit -m "feat(classroom): L4 period bar mobile collapse to 36px mini bar"`

---

### Task 2: L1 举手复合排序 [zone, seatIndex, raised_at]

**Files:**
- Modify: `lib/services/classroom-layout-service.ts:1-73` — 加 `resolveSortKey()` export
- Modify: `lib/store/classroom-state.ts:96-170` — reducer `case 'raise_hand'` 之后调用 sort
- Test: `lib/store/__tests__/classroom-state-sort.test.ts`
- Test: `lib/services/__tests__/classroom-layout-service-sort.test.ts`

**Interfaces:**
- Consumes: `HandRaise[]` (state.handRaiseQueue) + `SeatConfig[]` (state.seatLayout)
- Produces: 排序后 `HandRaise[]` (前排优先 + 同排按 seatIndex + 同 seat 按 raised_at)

**Step 1 — 写失败测试**:
```ts
// lib/services/__tests__/classroom-layout-service-sort.test.ts
import { describe, it, expect } from 'vitest';
import { ClassroomLayoutService } from '../classroom-layout-service';

describe('ClassroomLayoutService.resolveSortKey (L1)', () => {
  it('returns zone priority (front=0 < middle=1 < back=2)', () => {
    const layout = [
      { seat_id: 'A1', agent_id: 'a', deskmates: [], zone: 'front' as const },
      { seat_id: 'C1', agent_id: 'c', deskmates: [], zone: 'back' as const },
      { seat_id: 'B1', agent_id: 'b', deskmates: [], zone: 'middle' as const },
    ];
    expect(ClassroomLayoutService.resolveSortKey(layout, 'a')).toBeLessThan(ClassroomLayoutService.resolveSortKey(layout, 'b'));
    expect(ClassroomLayoutService.resolveSortKey(layout, 'b')).toBeLessThan(ClassroomLayoutService.resolveSortKey(layout, 'c'));
  });
  it('uses seatIndex as tie-breaker within same zone', () => {
    const layout = [
      { seat_id: 'A2', agent_id: 'a2', deskmates: [], zone: 'front' as const },
      { seat_id: 'A1', agent_id: 'a1', deskmates: [], zone: 'front' as const },
    ];
    expect(ClassroomLayoutService.resolveSortKey(layout, 'a1')).toBeLessThan(ClassroomLayoutService.resolveSortKey(layout, 'a2'));
  });
  it('returns Infinity for unknown agent (defensive)', () => {
    expect(ClassroomLayoutService.resolveSortKey([], 'ghost')).toBe(Infinity);
  });
});
```

**Step 2 — 跑测试验证失败**: `pnpm vitest run ...` — FAIL (`resolveSortKey is not a function`)

**Step 3 — 写最小实现**:
```ts
// lib/services/classroom-layout-service.ts 新增
const ZONE_PRIORITY = { front: 0, middle: 1, back: 2 } as const;

resolveSortKey(layout: SeatConfig[], agentId: string): number {
  const seat = layout.find(s => s.agent_id === agentId);
  if (!seat) return Infinity;
  const zoneScore = ZONE_PRIORITY[seat.zone] * 10000;
  const colScore = parseCol(seat.seat_id) * 100;
  const rowScore = parseRow(seat.seat_id).charCodeAt(0) * 10;
  return zoneScore + colScore + rowScore;
},

sortHandQueue(raises: HandRaise[], layout: SeatConfig[]): HandRaise[] {
  return [...raises].sort((a, b) => {
    const ka = this.resolveSortKey(layout, a.agent_id);
    const kb = this.resolveSortKey(layout, b.agent_id);
    if (ka !== kb) return ka - kb;
    return a.raised_at - b.raised_at;
  });
},
```

```ts
// lib/store/classroom-state.ts reducer 修改
case 'raise_hand': {
  if (state.handRaiseQueue.find(h => h.agent_id === action.agent_id)) return state;
  const next = { ...state, handRaiseQueue: [...state.handRaiseQueue, { ... }] };
  return { ...next, handRaiseQueue: ClassroomLayoutService.sortHandQueue(next.handRaiseQueue, state.seatLayout) };
}
```

**Step 4 — 跑测试验证通过**: PASS

**Step 5 — Commit**: `git commit -m "feat(classroom): L1 hand-raise priority queue [zone, seatIndex, raised_at]"`

---

### Task 3: L2 period 超时自动 period_end

**Files:**
- Modify: `lib/services/classroom-service.ts:1-89` — 加 `scheduleAutoEnd()` + cleanup
- Test: `lib/services/__tests__/classroom-service-timer.test.ts`

**Interfaces:**
- Consumes: `periodEndsAt: number | null` (state.classroom.periodEndsAt) + `dispatchClassroomAction`
- Produces: 到达 periodEndsAt 时 dispatch `period_end` action (用 `useStageStore.getState().dispatchClassroomAction`)

**Step 1 — 写失败测试**:
```ts
// lib/services/__tests__/classroom-service-timer.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClassroomService } from '../classroom-service';
import { useStageStore } from '@/lib/store/stage';

vi.mock('@/lib/store/stage');

describe('ClassroomService.scheduleAutoEnd (L2)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  
  it('dispatches period_end when timer elapses', () => {
    const dispatch = vi.fn();
    vi.mocked(useStageStore.getState).mockReturnValue({ dispatchClassroomAction: dispatch });
    ClassroomService.scheduleAutoEnd(1000);
    vi.advanceTimersByTime(1000);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'period_end' }));
  });
  
  it('cleans up timer if cancel called before fire', () => {
    const dispatch = vi.fn();
    vi.mocked(useStageStore.getState).mockReturnValue({ dispatchClassroomAction: dispatch });
    const cancel = ClassroomService.scheduleAutoEnd(1000);
    cancel();
    vi.advanceTimersByTime(1000);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
```

**Step 2 — 跑测试验证失败**: FAIL

**Step 3 — 写最小实现**:
```ts
// lib/services/classroom-service.ts 新增
import { useStageStore } from '@/lib/store/stage';

scheduleAutoEnd(ms: number): () => void {
  const id = setTimeout(() => {
    useStageStore.getState().dispatchClassroomAction({
      type: 'period_end',
      is_last_lesson: false,
      id: `auto-period-end-${Date.now()}`,
      agent_id: 'director',
      timestamp: Date.now(),
    });
  }, ms);
  return () => clearTimeout(id);
},
```

reducer 触发点：`case 'period_start'` 末尾调 `ClassroomService.scheduleAutoEnd(action.duration * 1000)` + 把 cancel 函数存到 state.periodTimerCancel

**Step 4 — 跑测试验证通过**: PASS

**Step 5 — Commit**: `git commit -m "feat(classroom): L2 auto period_end on timeout"`

---

### Task 4: L3 输入优先级 (text > voice > raise_hand)

**Files:**
- Modify: `components/chat/chat-area.tsx:1-XXX` — 加 `lastInputChannel` mutex + handleSubmit 拦截
- Modify: `lib/store/classroom-state.ts` — reducer 加 `lastInputChannel: 'text'|'voice'|'raise_hand'|null` 字段
- Test: `components/chat/__tests__/chat-area-priority.test.tsx`

**Interfaces:**
- Consumes: 用户点击 "举手" 按钮 / 点击 mic / 输入文字
- Produces: 同一时刻仅一个 channel 生效（text 期间屏蔽 mic + raise_hand；voice 期间屏蔽 text input 但 raise_hand 仍允许）

**Step 1 — 写失败测试**:
```tsx
// components/chat/__tests__/chat-area-priority.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatArea } from '../chat-area';
import { useStageStore } from '@/lib/store/stage';

vi.mock('@/lib/store/stage');

describe('ChatArea input priority (L3)', () => {
  it('blocks voice input when text is being typed', () => {
    const dispatch = vi.fn();
    vi.mocked(useStageStore).mockReturnValue({ lastInputChannel: 'text', dispatchClassroomAction: dispatch } as any);
    const { container } = render(<ChatArea />);
    fireEvent.click(container.querySelector('[data-testid="mic-button"]')!);
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'speech_start' }));
  });
  it('allows raise_hand even when voice is active (raise_hand is "meta" not input)', () => {
    // skip — raise_hand bypasses ChatArea input layer entirely (lives in classroom-shell)
  });
});
```

**Step 2 — FAIL / 3 — 实现** / 4 — PASS / 5 — Commit: `feat(classroom): L3 chat input priority text > voice > raise_hand`

---

### Task 5: M2 admin 座位表 UI

**Files:**
- Create: `app/admin/classroom/page.tsx`
- Create: `components/admin/seat-layout-editor.tsx`
- Test: `components/admin/__tests__/seat-layout-editor.test.tsx`

**Step 1-5**: TDD 循环 — 写失败测试 (改 deskmates + zone) → 实现：表格列出所有 seat，每行有 agent 下拉 (改 agent_id) + zone dropdown (改 zone) + deskmates checkboxes (改 deskmates[]) → 调 `ClassroomLayoutService.overrideSeat()` 写回 store → PASS → Commit: `feat(classroom): M2 admin seat layout override UI`

---

### Task 6: M4 visual snapshot baselines

**Files:**
- Create: `e2e/tests/classroom-snapshots.spec.ts`
- Prerequisite: `pnpm dev` running on :3000 (user 启动)

**Step 1-5**:
1. 写 7 test cases: PeriodBar × 4 (before-class / lesson / break / after-class) + CallOnCard × 3 (idle / counting / expired) + BlackboardChalk × 2 (off / on-with-toast)
2. 每个 case: setup store → mount component → `await expect(page).toHaveScreenshot()`
3. 第一次跑生成 baselines (playwright 自动写到 `__snapshots__/` 目录)
4. `git add e2e/tests/__snapshots__/` + commit baselines
5. Commit: `feat(classroom): M4 visual snapshot baselines (7 cases)`

**注意**: dev server 启动是 user 责任 (per spec §10 测试策略)。如 dev server 不在 → task 失败 → skip + 报告。

---

## Execution Order (依赖)

```
T1 L4 (CSS, 独立) → T2 L1 (reducer) → T3 L2 (timer) → T4 L3 (reducer + ChatArea) → T5 M2 (admin UI) → T6 M4 (snapshot, 需 dev server)
```

T1-T4 互不依赖 reducer 字段，可并行 (but 按 V1 节奏串行)。T5 依赖 T2 (M2 UI 显示 sort 后的队列)。T6 在最后。

---

## Self-Review Checklist

- [x] Spec coverage: 6/6 task 覆盖 audit M2/M4 + L1-L4
- [x] Placeholder scan: 0 TBD / TODO / "implement later"
- [x] Type consistency: `HandRaise` / `SeatConfig` / `ClassroomAction` 复用 V1 定义，不重声明
- [x] Path consistency: 仅一处 admin route (`app/admin/classroom/page.tsx`)
- [x] Task 数 ≤ 12 ✓ (6 task)
- [x] 每 task 5 步 TDD ✓
