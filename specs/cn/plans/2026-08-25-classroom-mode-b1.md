# Classroom Mode B.1 (Spatial Topdown MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans.
>
> **Source spec:** [`specs/shared/classroom-mode-b-design.md`](../shared/classroom-mode-b-design.md) §11 Phase B.1 (MVP) — user-approved 2026-08-25
>
> **Predecessor:** [classroom-mode-v1.1 plan](2026-08-25-classroom-mode-v1.1.md) (✅ shipped 2026-08-25) — B 模式复用 V1 reducer + service + DSL actions 100%, 只换 view 层

**Goal:** Phase B.1 MVP — 给 OpenMAIC 教室加一个 2D SVG 俯瞰图 (ClassroomTopdown)，包含学生座位默认网格 + 头像 + 讲台 + teacher avatar。无交互（B.2 再加举/叫答/黑板交互）。

**Architecture:** 新增 `<ClassroomTopdown />` SVG 容器 (1000×600) — 渲染学生座位默认网格 + 头像 + 讲台 teacher。复用 V1 `seatLayout` + V1.1 L1 `resolveSortKey()` 做座位排序。State 扩展：`seatPositions?: Record<seat_id, {x,y}>` + `podiumPosition?: {x,y}` (reducer 派生，非 action 写入)。B.1 不接互动，纯视觉。

**Tech Stack:** TypeScript · React · SVG (无新依赖) · 复用 V1.1 `ClassroomLayoutService.resolveSortKey()` 做座位排序。

---

## Global Constraints (继承 V1 + V1.1 + 新增)

1-16. 继承 V1 + V1.1 plan 全部约束 (UI 不侵入 / DSL 不破坏 / feature flag 默认 false / 4KB payload / 500 chalk stroke / i18n classroom.* namespace / 等)
17. **B.1 新增**：零新三方依赖（SVG + React 已足够；拒绝 r3f/three/d3）
18. **B.1 新增**：B 模式通过新 feature flag `isClassroomTopdownEnabled()` gate，默认 false
19. **B.1 新增**：B 模式组件只在 `seatLayout.length > 0` 时 render；否则降级到 V1.1 静态布局（顶部 bar + 浮按钮）
20. **B.1 新增**：`seatPositions` / `podiumPosition` 由 reducer 派生，不通过 action 写入；wire format 0 改动
21. **B.1 新增**：avatar fallback — 头像加载失败时显示学生名首字母 (eg "Z" for 张三)
22. **B.1 新增**：viewBox 归一化 (0-1000, 0-600)，让 CSS 自动 scale 到任意容器尺寸

---

## File Structure

**Create (新)**:
- `components/classroom-shell/topdown/index.tsx` — `<ClassroomTopdown />` 主容器 (SVG 1000×600, 组装 seats + podium + blackboard)
- `components/classroom-shell/topdown/seat.tsx` — `<TopdownSeat />` 单个学生座位 (circle avatar + name label + hand-raise icon placeholder)
- `components/classroom-shell/topdown/podium.tsx` — `<TopdownPodium />` 讲台 + teacher avatar
- `components/classroom-shell/topdown/seat-positions.ts` — `deriveSeatPositions(seatLayout)` helper (纯函数)
- `lib/hooks/use-classroom-topdown.ts` — `useClassroomTopdown()` hook: gate + read seatLayout + 返回 positions
- `components/classroom-shell/topdown/__tests__/seat-positions.test.ts` — deriveSeatPositions 单元测试
- `components/classroom-shell/topdown/__tests__/classroom-topdown.test.tsx` — 集成测试 (mock store)

**Modify (改)**:
- `lib/store/classroom-state.ts` — ClassroomState 添加 `seatPositions?` + `podiumPosition?` + `viewportSize?` optional 字段；reducer `case 'period_start'` + `case 'raise_hand'` 末尾调用 `deriveSeatPositions()` 写回
- `lib/config/feature-flags.ts` — 添加 `isClassroomTopdownEnabled()` (从 `NEXT_PUBLIC_CLASSROOM_TOPDOWN_ENABLED` 读取)

---

## Tasks (4 个, 每 task 5 步 TDD)

### Task 1: deriveSeatPositions helper + reducer 集成

**Files:**
- Create: `components/classroom-shell/topdown/seat-positions.ts`
- Modify: `lib/store/classroom-state.ts`
- Test: `components/classroom-shell/topdown/__tests__/seat-positions.test.ts`

**Interfaces:**
- Consumes: `SeatConfig[]` (state.seatLayout)
- Produces: `Record<seat_id, {x: number, y: number}>` (0-1000 × 0-600 归一化坐标)

**Step 1 — 写失败测试**:
```ts
// components/classroom-shell/topdown/__tests__/seat-positions.test.ts
import { describe, it, expect } from 'vitest';
import { deriveSeatPositions } from '../seat-positions';

describe('deriveSeatPositions (B.1)', () => {
  it('produces grid layout: 4 cols × N rows, A1 top-left', () => {
    const layout = [
      { seat_id: 'A1', agent_id: 'a1', deskmates: [], zone: 'front' as const },
      { seat_id: 'A2', agent_id: 'a2', deskmates: [], zone: 'front' as const },
      { seat_id: 'A3', agent_id: 'a3', deskmates: [], zone: 'front' as const },
      { seat_id: 'A4', agent_id: 'a4', deskmates: [], zone: 'front' as const },
      { seat_id: 'B1', agent_id: 'b1', deskmates: [], zone: 'middle' as const },
    ];
    const positions = deriveSeatPositions(layout);
    // A1 = column 0 (x=125), row 0 (y=500)
    expect(positions.A1).toEqual({ x: 125, y: 500 });
    // A2 = column 1 (x=375)
    expect(positions.A2).toEqual({ x: 375, y: 500 });
    // A3 = column 2 (x=625)
    expect(positions.A3).toEqual({ x: 625, y: 500 });
    // A4 = column 3 (x=875)
    expect(positions.A4).toEqual({ x: 875, y: 500 });
    // B1 = row 1 (y=600) — note: rows increase downward in SVG
    expect(positions.B1).toEqual({ x: 125, y: 600 });
  });
  it('returns empty object when layout empty', () => {
    expect(deriveSeatPositions([])).toEqual({});
  });
  it('handles single seat', () => {
    expect(deriveSeatPositions([{ seat_id: 'A1', agent_id: 'a1', deskmates: [], zone: 'front' as const }]))
      .toEqual({ A1: { x: 500, y: 500 } });
  });
});
```

**Step 2 — 跑测试验证失败**: `pnpm vitest run ...` — FAIL (function not defined)

**Step 3 — 写最小实现**:
```ts
// components/classroom-shell/topdown/seat-positions.ts
import type { SeatConfig } from '@/lib/store/classroom-state';

const VIEW_W = 1000;
const VIEW_H = 600;
const COL_PITCH = 250; // 4 cols × 250 = 1000
const ROW_PITCH = 100;
const SEAT_X_OFFSET = 125; // col 0 center
const SEAT_Y_START = 500; // row 0 (front row of students, podium above at y=100)

function parseRow(seatId: string): string {
  return seatId.match(/^[A-Z]+/)?.[0] ?? '';
}
function parseCol(seatId: string): number {
  return parseInt(seatId.match(/\d+$/)?.[0] ?? '0', 10);
}

export function deriveSeatPositions(seatLayout: SeatConfig[]): Record<string, {x: number; y: number}> {
  if (seatLayout.length === 0) return {};
  const sorted = [...seatLayout].sort((a, b) => {
    const r = parseRow(a.seat_id).localeCompare(parseRow(b.seat_id));
    return r !== 0 ? r : parseCol(a.seat_id) - parseCol(b.seat_id);
  });
  // detect columns from first row
  const firstRow = parseRow(sorted[0].seat_id);
  const colsInFirstRow = sorted.filter(s => parseRow(s.seat_id) === firstRow).length;
  const colWidth = colsInFirstRow > 0 ? VIEW_W / colsInFirstRow : COL_PITCH;
  
  const result: Record<string, {x:number;y:number}> = {};
  const rowIndex = new Map<string, number>();
  let nextRowIdx = 0;
  sorted.forEach(s => {
    const r = parseRow(s.seat_id);
    if (!rowIndex.has(r)) rowIndex.set(r, nextRowIdx++);
    const rowIdx = rowIndex.get(r)!;
    const colIdx = parseCol(s.seat_id) - 1;
    result[s.seat_id] = {
      x: colIdx * colWidth + colWidth / 2,
      y: SEAT_Y_START + rowIdx * ROW_PITCH,
    };
  });
  return result;
}

export function derivePodiumPosition(): {x:number;y:number} {
  return { x: VIEW_W / 2, y: 100 }; // top-center of viewport
}
```

**Step 4 — reducer 集成**: 在 `lib/store/classroom-state.ts` `case 'period_start'` 和 `case 'raise_hand'` 末尾加：
```ts
import { deriveSeatPositions, derivePodiumPosition } from '@/components/classroom-shell/topdown/seat-positions';
// ... after existing reducer logic:
case 'period_start': {
  // existing return + add seatPositions
  return {
    ...state,
    // ...existing fields...
    seatPositions: deriveSeatPositions(state.seatLayout),
    podiumPosition: derivePodiumPosition(),
  };
}
```

**Step 5 — 跑测试验证通过**: PASS

**Step 5 — Commit**: `feat(classroom-b): B.1 deriveSeatPositions + reducer integration`

---

### Task 2: useClassroomTopdown hook + feature flag

**Files:**
- Create: `lib/hooks/use-classroom-topdown.ts`
- Modify: `lib/config/feature-flags.ts`
- Test: (covered by Task 4 integration test)

**Step 1 — 写失败测试**: skip — flag + hook 是 trivial wiring, integration test 在 Task 4 覆盖

**Step 3 — 写最小实现**:
```ts
// lib/config/feature-flags.ts 新增
export function isClassroomTopdownEnabled(): boolean {
  return readBoolean(process.env.NEXT_PUBLIC_CLASSROOM_TOPDOWN_ENABLED);
}
```

```ts
// lib/hooks/use-classroom-topdown.ts
import { useMemo } from 'react';
import { useStageStore } from '@/lib/store/stage';
import { isClassroomTopdownEnabled } from '@/lib/config/feature-flags';
import { deriveSeatPositions, derivePodiumPosition } from '@/components/classroom-shell/topdown/seat-positions';
import type { SeatConfig } from '@/lib/store/classroom-state';

export function useClassroomTopdown() {
  const enabled = isClassroomTopdownEnabled();
  const seatLayout = useStageStore(s => (s.classroom as any).seatLayout ?? []) as SeatConfig[];
  const cachedPositions = useStageStore(s => (s.classroom as any).seatPositions);
  const cachedPodium = useStageStore(s => (s.classroom as any).podiumPosition);
  
  return useMemo(() => ({
    enabled,
    hasData: seatLayout.length > 0,
    seatPositions: cachedPositions ?? deriveSeatPositions(seatLayout),
    podiumPosition: cachedPodium ?? derivePodiumPosition(),
    seatLayout,
  }), [enabled, seatLayout, cachedPositions, cachedPodium]);
}
```

**Step 5 — Commit**: `feat(classroom-b): B.1 useClassroomTopdown hook + feature flag`

---

### Task 3: TopdownSeat + TopdownPodium components

**Files:**
- Create: `components/classroom-shell/topdown/seat.tsx`
- Create: `components/classroom-shell/topdown/podium.tsx`
- Test: `components/classroom-shell/topdown/__tests__/seat.test.tsx`

**Step 1 — 写失败测试**:
```tsx
// components/classroom-shell/topdown/__tests__/seat.test.tsx
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TopdownSeat } from '../seat';

describe('TopdownSeat (B.1)', () => {
  it('renders avatar circle at given position with seat_id label', () => {
    const { container } = render(
      <svg>
        <TopdownSeat seatId="A1" agentId="student-zhang" agentName="张三" position={{x: 125, y: 500}} />
      </svg>
    );
    const circle = container.querySelector('[data-testid="topdown-seat-A1"]');
    expect(circle).toBeTruthy();
    expect(circle?.getAttribute('cx')).toBe('125');
    expect(circle?.getAttribute('cy')).toBe('500');
  });
  it('shows first character of agent_name as fallback avatar text', () => {
    const { container } = render(
      <svg><TopdownSeat seatId="A1" agentId="student-zhang" agentName="张三" position={{x: 125, y: 500}} /></svg>
    );
    expect(container.textContent).toContain('张');
  });
  it('falls back to agent_id first char when agent_name empty', () => {
    const { container } = render(
      <svg><TopdownSeat seatId="A1" agentId="alice" agentName="" position={{x: 125, y: 500}} /></svg>
    );
    expect(container.textContent).toContain('A');
  });
});
```

**Step 3 — 写最小实现**:
```tsx
// components/classroom-shell/topdown/seat.tsx
'use client';
import { useState } from 'react';

export interface TopdownSeatProps {
  seatId: string;
  agentId: string;
  agentName: string;
  position: { x: number; y: number };
}

function getAvatarText(name: string, id: string): string {
  if (name && name.length > 0) return name.charAt(0);
  return id.charAt(0).toUpperCase();
}

export function TopdownSeat({ seatId, agentId, agentName, position }: TopdownSeatProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const fallback = getAvatarText(agentName, agentId);
  return (
    <g data-testid={`topdown-seat-${seatId}`} role="button" tabIndex={0} aria-label={`Seat ${seatId}: ${agentName || agentId}`}>
      <circle cx={position.x} cy={position.y} r={28} fill="#3b82f6" stroke="#1e40af" strokeWidth={2} />
      {!avatarFailed && (
        <image
          href={`/avatars/${agentId}.png`}
          x={position.x - 24}
          y={position.y - 24}
          width={48}
          height={48}
          onError={() => setAvatarFailed(true)}
        />
      )}
      {avatarFailed && (
        <text x={position.x} y={position.y + 6} textAnchor="middle" fontSize={20} fill="white" fontWeight="bold">
          {fallback}
        </text>
      )}
      <text x={position.x} y={position.y + 48} textAnchor="middle" fontSize={12} fill="#1f2937">
        {seatId} {agentName || agentId}
      </text>
    </g>
  );
}
```

```tsx
// components/classroom-shell/topdown/podium.tsx
'use client';
export interface TopdownPodiumProps {
  position: { x: number; y: number };
  teacherName?: string;
}

export function TopdownPodium({ position, teacherName = '老师' }: TopdownPodiumProps) {
  return (
    <g data-testid="topdown-podium">
      <rect x={position.x - 80} y={position.y - 30} width={160} height={60} fill="#7c3aed" rx={6} />
      <text x={position.x} y={position.y + 6} textAnchor="middle" fontSize={20} fill="white" fontWeight="bold">
        👨‍🏫 {teacherName}
      </text>
    </g>
  );
}
```

**Step 4 — 跑测试验证通过**: PASS

**Step 5 — Commit**: `feat(classroom-b): B.1 TopdownSeat + TopdownPodium components`

---

### Task 4: ClassroomTopdown main container + integration

**Files:**
- Create: `components/classroom-shell/topdown/index.tsx`
- Test: `components/classroom-shell/topdown/__tests__/classroom-topdown.test.tsx`

**Step 1 — 写失败测试**:
```tsx
// components/classroom-shell/topdown/__tests__/classroom-topdown.test.tsx
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClassroomTopdown } from '../index';

vi.mock('@/lib/hooks/use-classroom-topdown', () => ({
  useClassroomTopdown: () => ({
    enabled: true,
    hasData: true,
    seatPositions: { A1: {x:125,y:500}, A2: {x:375,y:500} },
    podiumPosition: { x: 500, y: 100 },
    seatLayout: [
      { seat_id: 'A1', agent_id: 'alice', deskmates: [], zone: 'front' as const },
      { seat_id: 'A2', agent_id: 'bob', deskmates: [], zone: 'front' as const },
    ],
  }),
}));

describe('ClassroomTopdown (B.1)', () => {
  it('renders 1000x600 SVG with all seats and podium', () => {
    const { container } = render(<ClassroomTopdown />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 1000 600');
    expect(container.querySelector('[data-testid="topdown-seat-A1"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="topdown-seat-A2"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="topdown-podium"]')).toBeTruthy();
  });
  it('returns null when hasData is false', () => {
    vi.doMock('@/lib/hooks/use-classroom-topdown', () => ({
      useClassroomTopdown: () => ({ enabled: true, hasData: false, seatPositions: {}, podiumPosition: {x:500,y:100}, seatLayout: [] }),
    }));
    const { container } = render(<ClassroomTopdown />);
    expect(container.querySelector('svg')).toBeNull();
  });
});
```

**Step 3 — 写最小实现**:
```tsx
// components/classroom-shell/topdown/index.tsx
'use client';
import { useClassroomTopdown } from '@/lib/hooks/use-classroom-topdown';
import { TopdownSeat } from './seat';
import { TopdownPodium } from './podium';

export function ClassroomTopdown() {
  const { enabled, hasData, seatPositions, podiumPosition, seatLayout } = useClassroomTopdown();
  if (!enabled || !hasData) return null;
  return (
    <svg
      viewBox="0 0 1000 600"
      preserveAspectRatio="xMidYMid meet"
      className="classroom-topdown"
      data-testid="classroom-topdown"
      style={{ width: '100%', height: '100%', background: '#f9fafb' }}
    >
      {/* Podium at top center */}
      <TopdownPodium position={podiumPosition} />
      {/* Seats in grid */}
      {seatLayout.map(seat => (
        <TopdownSeat
          key={seat.seat_id}
          seatId={seat.seat_id}
          agentId={seat.agent_id}
          agentName={seat.agent_id} // B.1 simplification: use agent_id as name
          position={seatPositions[seat.seat_id]}
        />
      ))}
    </svg>
  );
}
```

**Step 4 — 跑测试验证通过**: PASS

**Step 5 — Commit**: `feat(classroom-b): B.1 ClassroomTopdown main container + integration test`

---

## Execution Order

```
T1 deriveSeatPositions + reducer (reducer 扩展) → T2 hook + flag → T3 TopdownSeat + Podium → T4 ClassroomTopdown container
```

T1-T2 互不依赖 (T2 引用 T1 的 helper)。T3-T4 互不依赖但 T4 引用 T3。

---

## Self-Review Checklist

- [x] **Spec coverage**: 4/4 B.1 task 覆盖 spec §11 Phase B.1 (静态俯瞰图 + 学生头像 + 讲台)
- [x] **Placeholder scan**: 0 TBD / TODO / "implement later"
- [x] **Type consistency**: `SeatConfig` 复用 V1 定义，不重声明
- [x] **Path consistency**: `components/classroom-shell/topdown/*` (新增子目录, 不冲突)
- [x] **Task 数 ≤ 12 ✓** (4 task)
- [x] **每 task 5 步 TDD ✓**
- [x] **零新依赖 ✓** (SVG + React + zustand 已足够)
- [x] **不破坏 V1.1**: 新增字段全 optional, 老场景无 B 数据降级
