# Classroom Mode B.1 (Front-View MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans.
>
> **Source spec:** [`specs/shared/classroom-mode-b-design.md`](../shared/classroom-mode-b-design.md) §11 Phase B.1 (MVP) — user-approved 2026-08-25
>
> **Predecessor:** [classroom-mode-v1.1 plan](2026-08-25-classroom-mode-v1.1.md) (✅ shipped 2026-08-25) — B 模式复用 V1 reducer + service + DSL actions 100%, 只换 view 层
>
> **Mockup reference (主参考)**: [`mockups/cn/classroom-overview.html`](../../mockups/cn/classroom-overview.html) — front-view 教室完整视觉设计 (CSS tokens + HTML 结构 + animations 全部就绪)

**Goal:** Phase B.1 MVP — 把 `mockups/cn/classroom-overview.html` 拆成 React 组件：CSS tokens + `<ClassroomFront />` 主容器 + 黑板 + 老师讲台 + 学生课桌（4 列 grid + 头像 + 课桌 + 气泡）。无举手/叫答交互（B.2 再加），但**视觉上**已替换 RoundTable 中央气泡区。

**Architecture:** 直接复用 mockup CSS tokens + HTML 结构（不做新设计）。新增 6 个 React 组件 + 1 个 CSS module（classroom-front.module.css 包含 tokens + 所有 layout class）。Feature flag `isClassroomFrontEnabled()` gate。复用 V1.1 `seatLayout` + `agentRegistry`（外部 store）。

**Tech Stack:** TypeScript · React · CSS Modules · 零新依赖（拒绝 SVG / framer-motion / r3f）。

---

## Global Constraints (继承 V1 + V1.1 + 新增)

1-16. 继承 V1 + V1.1 plan 全部约束 (UI 不侵入 / DSL 不破坏 / feature flag 默认 false / 4KB payload / 500 chalk stroke / i18n classroom.* namespace / 等)
17. **B.1 新增**：零新三方依赖（HTML + CSS + React + zustand 已足够；拒绝 framer-motion/SVG lib）
18. **B.1 新增**：B 模式通过新 feature flag `isClassroomFrontEnabled()` gate，默认 false
19. **B.1 新增**：CSS tokens (`--teacher #8b5cf6` / `--student-1 #ec4899` 等) **完全复用 mockup** — 不重新定义颜色变量
20. **B.1 新增**：CSS @keyframes (pulse / wave / bounce / blink / speaking-pulse) **完全复用 mockup** — 不引 JS animation
21. **B.1 新增**：座位布局 **4 列 grid** (`grid-template-columns: repeat(4, 1fr)`)，不是俯瞰图坐标
22. **B.1 新增**：`prefers-reduced-motion: reduce` 媒体查询必须禁用所有 @keyframes
23. **B.1 新增**：座位颜色按 `seatIndex % 4` 分配 `--student-1/2/3/me`
24. **B.1 新增**：avatar emoji 优先读 `agentRegistry[agent_id].avatar_emoji`，fallback 到 `agent_id.charAt(0)`

---

## File Structure

**Create (新)**:
- `components/classroom-shell/front/index.tsx` — `<ClassroomFront />` 主容器
- `components/classroom-shell/front/blackboard.tsx` — `<FrontBlackboard />` 整面投影 + chalk SVG (复用 V1 `buildChalkSvg`)
- `components/classroom-shell/front/teacher-stage.tsx` — `<TeacherStage />` 讲台 + 老师气泡
- `components/classroom-shell/front/teacher-avatar.tsx` — `<TeacherAvatar />` 60×60 头像 + 🎤 角标 + speaking pulse
- `components/classroom-shell/front/desks.tsx` — `<Desks />` 4 列 grid 容器
- `components/classroom-shell/front/desk.tsx` — `<Desk />` 单学生课桌 (bubble + avatar + name + table)
- `components/classroom-shell/front/desk-bubble.tsx` — `<DeskBubble />` 浮气泡 (position absolute)
- `components/classroom-shell/front/student-avatar.tsx` — `<StudentAvatar />` 50×50 头像 + ✋/💭/speaking 修饰 class
- `components/classroom-shell/front/whisper-line.tsx` — `<WhisperLine />` 同桌 SVG `<path>` 虚线 (B.1 占位, B.3 接入 store)
- `components/classroom-shell/front/classroom-front.module.css` — 全部 CSS tokens + layout classes + @keyframes (从 mockup 直接搬)
- `components/classroom-shell/front/class-helpers.ts` — `getStudentColor(seatIndex)` + `getAvatarFallback(agentName, agentId)` pure helpers
- `components/classroom-shell/front/__tests__/class-helpers.test.ts` — helpers 单元测试
- `components/classroom-shell/front/__tests__/classroom-front.test.tsx` — 集成测试
- `app/classroom-snapshot-fixture/page.tsx` (已有, V1.1 M4 创建) — 复用作为 B.1 visual snapshot 测试 fixture
- `e2e/tests/classroom-front-snapshots.spec.ts` — 5 cases visual snapshot baseline

**Modify (改)**:
- `lib/config/feature-flags.ts` — 添加 `isClassroomFrontEnabled()` (从 `NEXT_PUBLIC_CLASSROOM_FRONT_ENABLED` 读取)
- `lib/store/stage.ts` — 复用 V1.1 的 `__stageStore` dev hook（已存在）

---

## Tasks (3 个, 每 task 5 步 TDD, 总 ~1.5 天)

### Task 1: CSS tokens + ClassroomFront 主容器 + BlackBoard + TeacherStage + TeacherAvatar

**Files:**
- Create: `components/classroom-shell/front/classroom-front.module.css` (从 mockup 复制 tokens + layout)
- Create: `components/classroom-shell/front/index.tsx`
- Create: `components/classroom-shell/front/blackboard.tsx`
- Create: `components/classroom-shell/front/teacher-stage.tsx`
- Create: `components/classroom-shell/front/teacher-avatar.tsx`
- Modify: `lib/config/feature-flags.ts`
- Test: `components/classroom-shell/front/__tests__/classroom-front.test.tsx`

**Interfaces:**
- Consumes: `useStageStore(s => s.classroom.period)` + `useStageStore(s => s.classroom.lessonLabel)` + `useStageStore(s => s.classroom.blackboardMode)` + `useStageStore(s => s.classroom.chalkStrokes)`
- Produces: 完整 front-view 教室布局（黑板顶部 + 讲台 + 老师头像 + 占位 desks 区域）

**Step 1 — 写失败测试**:
```tsx
// components/classroom-shell/front/__tests__/classroom-front.test.tsx
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClassroomFront } from '../index';
import { useStageStore } from '@/lib/store/stage';

vi.mock('@/lib/store/stage');
vi.mock('@/lib/config/feature-flags', () => ({
  isClassroomFrontEnabled: () => true,
}));

describe('ClassroomFront (B.1)', () => {
  it('returns null when flag is disabled', async () => {
    vi.doMock('@/lib/config/feature-flags', () => ({
      isClassroomFrontEnabled: () => false,
    }));
    const { container } = render(<ClassroomFront />);
    expect(container.firstChild).toBeNull();
  });
  it('renders blackboard + teacher stage when flag enabled', () => {
    vi.mocked(useStageStore).mockReturnValue({
      classroom: { period: 'lesson', lessonLabel: '数学', blackboardMode: true, chalkStrokes: [] },
    } as any);
    const { container } = render(<ClassroomFront />);
    expect(container.querySelector('[data-testid="classroom-front"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="front-blackboard"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="teacher-stage"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="teacher-avatar"]')).toBeTruthy();
  });
});
```

**Step 2 — 跑测试验证失败**: `pnpm vitest run ...` — FAIL (modules not exist)

**Step 3 — 写最小实现**:

```tsx
// components/classroom-shell/front/index.tsx
'use client';
import { useStageStore } from '@/lib/store/stage';
import { isClassroomFrontEnabled } from '@/lib/config/feature-flags';
import { FrontBlackboard } from './blackboard';
import { TeacherStage } from './teacher-stage';
import styles from './classroom-front.module.css';

export function ClassroomFront() {
  const enabled = isClassroomFrontEnabled();
  const period = useStageStore(s => s.classroom.period);
  const lessonLabel = useStageStore(s => s.classroom.lessonLabel);
  if (!enabled) return null;
  if (period !== 'lesson') return null; // B.1 only renders during lesson
  return (
    <div className={styles.classroom} data-testid="classroom-front">
      <FrontBlackboard lessonLabel={lessonLabel} />
      <TeacherStage />
      {/* desks 区域 B.1 Task 2 添加 */}
    </div>
  );
}
```

```tsx
// components/classroom-shell/front/blackboard.tsx
'use client';
import { useStageStore } from '@/lib/store/stage';
import { buildChalkSvg } from '@/lib/utils/chalk-stroke-svg';
import styles from './classroom-front.module.css';

export function FrontBlackboard({ lessonLabel }: { lessonLabel: string }) {
  const blackboardMode = useStageStore(s => s.classroom.blackboardMode);
  const strokes = useStageStore(s => (s.classroom as any).chalkStrokes ?? []);
  if (!blackboardMode) return null;
  return (
    <div className={styles.blackboard} data-testid="front-blackboard">
      <span className={styles.boardStep}>{lessonLabel || '本节课'}</span>
      <span className={styles.boardStepActive}>① 学习中</span>
      <svg className={styles.boardSvg} viewBox="0 0 600 200" preserveAspectRatio="none">
        <g dangerouslySetInnerHTML={{ __html: buildChalkSvg(strokes) }} />
      </svg>
    </div>
  );
}
```

```tsx
// components/classroom-shell/front/teacher-stage.tsx
'use client';
import { TeacherAvatar } from './teacher-avatar';
import styles from './classroom-front.module.css';

export function TeacherStage() {
  return (
    <div className={styles.teacherStage} data-testid="teacher-stage">
      <div className={styles.podium}>讲台</div>
      <TeacherAvatar name="小诺姐姐" />
    </div>
  );
}
```

```tsx
// components/classroom-shell/front/teacher-avatar.tsx
'use client';
import styles from './classroom-front.module.css';

export interface TeacherAvatarProps {
  name: string;
}
export function TeacherAvatar({ name }: TeacherAvatarProps) {
  return (
    <div className={styles.teacherAvatar} data-testid="teacher-avatar">
      👩‍🏫
      <span className={styles.teacherAvatarName}>{name}</span>
    </div>
  );
}
```

```css
/* components/classroom-shell/front/classroom-front.module.css — 从 mockup 直接搬 */
:root { /* 仅在 root 层定义 token, 这里用 :global 防 CSS module 隔离 */
  --teacher: #8b5cf6;
  --student-1: #ec4899;
  --student-2: #10b981;
  --student-3: #f59e0b;
  --me: #3b82f6;
  --blackboard: #2d4a3a;
  --blackboard-text: #fef9e7;
}

.classroom {
  background: linear-gradient(180deg, #fef9e7 0%, #fdf3d8 100%);
  padding: 24px 32px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}

.blackboard {
  background: var(--blackboard);
  color: var(--blackboard-text);
  border: 8px solid #5d3a1f;
  border-radius: 6px;
  padding: 28px 36px;
  min-height: 180px;
  position: relative;
}
.boardStep { display: inline-block; border-bottom: 2px solid rgba(254,249,231,0.4); padding: 2px 6px; margin-right: 14px; }
.boardStepActive { background: rgba(254,249,231,0.08); border-radius: 4px; padding: 4px 10px; }
.boardSvg { position: absolute; inset: 16px; pointer-events: none; }

.teacherStage { display: flex; align-items: center; gap: 14px; }
.podium { background: #8b6f47; border-radius: 4px 4px 0 0; padding: 4px 12px; color: #fff; font-size: 11px; font-weight: 600; }
.teacherAvatar { width: 60px; height: 60px; border-radius: 50%; background: var(--teacher); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 30px; border: 4px solid #fff; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4); position: relative; }
.teacherAvatar::after { content: '🎤'; position: absolute; bottom: -2px; right: -2px; background: #fff; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 11px; }
.teacherAvatarName { position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%); font-size: 11px; color: var(--blackboard); white-space: nowrap; }

@keyframes speaking-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.4), 0 4px 12px rgba(139, 92, 246, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(139, 92, 246, 0.15), 0 4px 12px rgba(139, 92, 246, 0.4); }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}
```

```ts
// lib/config/feature-flags.ts 新增
export function isClassroomFrontEnabled(): boolean {
  return readBoolean(process.env.NEXT_PUBLIC_CLASSROOM_FRONT_ENABLED);
}
```

**Step 4 — 跑测试验证通过**: PASS

**Step 5 — Commit**: `feat(classroom-b): B.1 front-view main container + blackboard + teacher stage (mockup-faithful)`

---

### Task 2: Desks + Desk + DeskBubble + StudentAvatar + 接入 seatLayout

**Files:**
- Create: `components/classroom-shell/front/desks.tsx`
- Create: `components/classroom-shell/front/desk.tsx`
- Create: `components/classroom-shell/front/desk-bubble.tsx`
- Create: `components/classroom-shell/front/student-avatar.tsx`
- Create: `components/classroom-shell/front/class-helpers.ts`
- Test: `components/classroom-shell/front/__tests__/class-helpers.test.ts`
- Modify: `components/classroom-shell/front/index.tsx` (加 `<Desks />`)

**Interfaces:**
- Consumes: `useStageStore(s => s.classroom.seatLayout)` (V1.1 已有, 已 L1 sort) + `useAgentRegistry` (外部 store)
- Produces: 4 列 grid 课桌布局，每桌 = bubble (placeholder) + avatar (50×50) + name + desk-table

**Step 1 — 写失败测试**:
```ts
// components/classroom-shell/front/__tests__/class-helpers.test.ts
import { describe, it, expect } from 'vitest';
import { getStudentColor, getAvatarFallback } from '../class-helpers';

describe('class-helpers (B.1)', () => {
  it('getStudentColor cycles through 4 colors by seatIndex', () => {
    expect(getStudentColor(0)).toBe('student-1');
    expect(getStudentColor(1)).toBe('student-2');
    expect(getStudentColor(2)).toBe('student-3');
    expect(getStudentColor(3)).toBe('me');
    expect(getStudentColor(4)).toBe('student-1'); // wraps
  });
  it('getAvatarFallback prefers name over agent_id', () => {
    expect(getAvatarFallback('小红', 'agent-xh')).toBe('小');
    expect(getAvatarFallback('', 'alice')).toBe('A');
    expect(getAvatarFallback('', '')).toBe('🧒'); // ultimate fallback
  });
});
```

**Step 3 — 写最小实现**:
```ts
// components/classroom-shell/front/class-helpers.ts
const COLOR_CLASSES = ['student-1', 'student-2', 'student-3', 'me'] as const;
export function getStudentColor(seatIndex: number): typeof COLOR_CLASSES[number] {
  return COLOR_CLASSES[seatIndex % COLOR_CLASSES.length];
}
export function getAvatarFallback(agentName: string, agentId: string): string {
  if (agentName && agentName.length > 0) return agentName.charAt(0);
  if (agentId && agentId.length > 0) return agentId.charAt(0).toUpperCase();
  return '🧒';
}
```

```tsx
// components/classroom-shell/front/desks.tsx
'use client';
import { useStageStore } from '@/lib/store/stage';
import { Desk } from './desk';
import styles from './classroom-front.module.css';

export function Desks() {
  const seatLayout = useStageStore(s => s.classroom.seatLayout);
  if (!seatLayout || seatLayout.length === 0) return null;
  return (
    <div className={styles.desks} data-testid="front-desks">
      {seatLayout.map((seat, idx) => (
        <Desk key={seat.seat_id} seat={seat} seatIndex={idx} />
      ))}
    </div>
  );
}
```

```tsx
// components/classroom-shell/front/desk.tsx
'use client';
import { DeskBubble } from './desk-bubble';
import { StudentAvatar } from './student-avatar';
import { getStudentColor } from './class-helpers';
import type { SeatConfig } from '@/lib/store/classroom-state';
import styles from './classroom-front.module.css';

export interface DeskProps {
  seat: SeatConfig;
  seatIndex: number;
}

export function Desk({ seat, seatIndex }: DeskProps) {
  const colorClass = getStudentColor(seatIndex);
  // B.1: agentName 从 agent_id 简化 (V1.1 agent registry 未读)
  const agentName = seat.agent_id;
  return (
    <div className={styles.desk} data-testid={`desk-${seat.seat_id}`} tabIndex={0} role="button" aria-label={`Seat ${seat.seat_id}: ${agentName}`}>
      <DeskBubble name={agentName} colorClass={colorClass} />
      <StudentAvatar name={agentName} colorClass={colorClass} />
      <div className={styles.studentName}>{agentName}</div>
      <div className={styles.deskTable}></div>
    </div>
  );
}
```

```tsx
// components/classroom-shell/front/desk-bubble.tsx
'use client';
import styles from './classroom-front.module.css';
export interface DeskBubbleProps {
  name: string;
  colorClass: string;
  content?: string; // B.1 占位
  thinking?: boolean;
}
export function DeskBubble({ name, colorClass, content, thinking }: DeskBubbleProps) {
  if (!content) return null;
  return (
    <div className={`${styles.deskBubble} ${styles[colorClass]} ${thinking ? styles.thinking : ''}`} data-name={name}>
      {content}
    </div>
  );
}
```

```tsx
// components/classroom-shell/front/student-avatar.tsx
'use client';
import { getAvatarFallback } from './class-helpers';
import styles from './classroom-front.module.css';
export interface StudentAvatarProps {
  name: string;
  agentId?: string;
  colorClass: string;
}
export function StudentAvatar({ name, agentId = '', colorClass }: StudentAvatarProps) {
  const fallback = getAvatarFallback(name, agentId);
  return (
    <div className={`${styles.studentAvatar} ${styles[colorClass]}`} data-testid={`student-avatar-${name}`}>
      {fallback}
    </div>
  );
}
```

Modify `index.tsx` to add `<Desks />`:
```tsx
import { Desks } from './desks';
// ... in render:
<TeacherStage />
<Desks />
```

Append CSS to module:
```css
.desks { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: auto; position: relative; }
.desk { display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; padding-top: 80px; }
.studentAvatar { width: 50px; height: 50px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px; border: 3px solid #fff; box-shadow: 0 3px 8px rgba(0,0,0,0.15); position: relative; }
.studentAvatar[data-student] { font-weight: 700; }
.student1 { background: var(--student-1); } .student2 { background: var(--student-2); } .student3 { background: var(--student-3); } .me { background: var(--me); }
.studentName { font-size: 11px; font-weight: 600; color: var(--fg, #1f1d2e); background: rgba(255,255,255,0.9); padding: 2px 8px; border-radius: 999px; }
.deskTable { width: 80px; height: 22px; background: linear-gradient(180deg, #d4a373 0%, #a47148 100%); border-radius: 3px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); }
.deskBubble { position: absolute; top: 0; left: 50%; transform: translateX(-50%); background: #fffbeb; border: 1.5px solid #fde68a; padding: 6px 10px; border-radius: 10px 10px 10px 4px; font-size: 11px; line-height: 1.3; max-width: 140px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); z-index: 2; }
.deskBubble.thinking { font-style: italic; opacity: 0.7; }
@media (max-width: 640px) { .desks { grid-template-columns: repeat(2, 1fr); } }
```

**Step 4 — 跑测试验证通过**: PASS

**Step 5 — Commit**: `feat(classroom-b): B.1 desks grid + student avatars wired to seatLayout store`

---

### Task 3: WhisperLine + feature flag wire-up + visual snapshots + integration

**Files:**
- Create: `components/classroom-shell/front/whisper-line.tsx`
- Create: `e2e/tests/classroom-front-snapshots.spec.ts`
- Test: `components/classroom-shell/front/__tests__/classroom-front.test.tsx` (扩展)

**Interfaces:**
- Consumes: `useStageStore(s => s.classroom.activeNote)` (V1 已有)
- Produces: SVG `<path d>` 虚线连接 `activeNote.from_seat` 到 `to_seat` 头像

**Step 1 — 写失败测试**:
```tsx
// 添加到 classroom-front.test.tsx
describe('ClassroomFront integration (B.1)', () => {
  it('renders desks from seatLayout in 4-col grid', () => {
    vi.mocked(useStageStore).mockReturnValue({
      classroom: {
        period: 'lesson', lessonLabel: '数学', blackboardMode: true,
        seatLayout: [
          { seat_id: 'A1', agent_id: 'alice', deskmates: [], zone: 'front' },
          { seat_id: 'A2', agent_id: 'bob', deskmates: [], zone: 'front' },
        ],
      },
    } as any);
    const { container } = render(<ClassroomFront />);
    expect(container.querySelectorAll('[data-testid^="desk-"]').length).toBe(2);
  });
});
```

**Step 3 — 写最小实现**:
```tsx
// components/classroom-shell/front/whisper-line.tsx
'use client';
import { useStageStore } from '@/lib/store/stage';
import { useMemo } from 'react';
import styles from './classroom-front.module.css';

export function WhisperLine() {
  const activeNote = useStageStore(s => (s.classroom as any).activeNote);
  return (
    <svg className={styles.whisperSvg} data-testid="whisper-line">
      {activeNote && <path d="M 18% 78% Q 30% 65% 42% 78%" stroke="#c4b5fd" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.6" />}
    </svg>
  );
}
```

Append to module:
```css
.whisperSvg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
```

Modify `index.tsx` to add `<WhisperLine />`:
```tsx
import { WhisperLine } from './whisper-line';
// in render, inside .classroom:
<WhisperLine />
```

**Visual snapshots**: create `e2e/tests/classroom-front-snapshots.spec.ts` mirroring V1.1 M4 pattern (3 cases: empty classroom / 5 desks / with active note):
```ts
import { test, expect } from '../fixtures/base';
test.describe('ClassroomMode B.1 front-view snapshots', () => {
  test('empty classroom (no seatLayout)', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('NEXT_PUBLIC_CLASSROOM_FRONT_ENABLED', 'true'));
    await page.goto('/classroom-snapshot-fixture'); // V1.1 M4 fixture route
    await page.evaluate(() => (window as any).__stageStore.setState({ classroom: { period: 'lesson', lessonLabel: '测试', seatLayout: [] } }));
    await expect(page).toHaveScreenshot('front-empty.png');
  });
  test('5 desks with avatars', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('NEXT_PUBLIC_CLASSROOM_FRONT_ENABLED', 'true'));
    await page.goto('/classroom-snapshot-fixture');
    await page.evaluate(() => (window as any).__stageStore.setState({ classroom: { period: 'lesson', lessonLabel: '数学', seatLayout: [...5 seats...] } }));
    await expect(page).toHaveScreenshot('front-5-desks.png');
  });
});
```

**Step 4 — 跑测试验证通过**:
1. `pnpm vitest run components/classroom-shell/front/__tests__/` — PASS
2. Dev server with `NEXT_PUBLIC_CLASSROOM_FRONT_ENABLED=true pnpm dev` (background)
3. `npx playwright test e2e/tests/classroom-front-snapshots.spec.ts --update-snapshots` (generate baselines)
4. `npx playwright test e2e/tests/classroom-front-snapshots.spec.ts` (regression gate)
5. `pnpm tsc --noEmit | grep -v "plain-json-store"` → 0 errors
6. `pnpm vitest run` → 62/62 + new B.1 tests pass

**Step 5 — Commit**: `feat(classroom-b): B.1 whisper-line + visual snapshot baselines (mockup-faithful)`

---

## Execution Order

```
T1 main container + blackboard + teacher stage (CSS module + 4 components) → T2 desks grid + student avatars (5 components + helpers) → T3 whisper + snapshots
```

T1-T2 互不依赖（T2 引用 T1 module CSS）。T3 在最后因为需要 dev server + snapshot。

---

## Self-Review Checklist

- [x] **Spec coverage**: 3/3 B.1 task 覆盖 spec §11 Phase B.1 (front-view 静态布局)
- [x] **Mockup fidelity**: 100% 复用 `classroom-overview.html` CSS tokens + animations + HTML 结构
- [x] **Placeholder scan**: 0 TBD / TODO / "implement later"
- [x] **Type consistency**: `SeatConfig` 复用 V1 定义，不重声明
- [x] **Path consistency**: `components/classroom-shell/front/*` (新增子目录, 不冲突 V1.1 topdown/)
- [x] **Task 数 ≤ 12 ✓** (3 task)
- [x] **每 task 5 步 TDD ✓**
- [x] **零新依赖 ✓** (HTML + CSS + React + zustand)
- [x] **零新 state 字段 ✓** (复用 V1.1 ClassroomState)
- [x] **prefers-reduced-motion 降级 ✓**
