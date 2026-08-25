# OpenMAIC · Classroom Mode B (Front-View Classroom) Design

**Date**: 2026-08-25 (revised after mockup review)
**Status**: ✅ **User approved (2026-08-25)** · Pending writing-plans
**Scope**: Engine-level feature · CN + INTL both use · Phase B (post-V1.1)
**Approach chosen**: **B · Front-view CSS classroom** (anchor = "you're inside the classroom facing the teacher", full C parity)
**Spec owner**: TBD
**Implementation**: ~1.5 days for B.1 MVP (3 task, less than original plan because mockup CSS already complete)
**Predecessor**: [classroom-mode-design.md](./classroom-mode-design.md) (V1 ✅ shipped, V1.1 ✅ shipped 2026-08-25)

---

## 0. User Decisions Log (2026-08-25)

| # | 议题 | 决策 |
|---|---|---|
| B-D1 | B 模式 vs V1.1 C 模式关系 | **仅 B, C 弃用** — B 完整包含 C 所有交互（举/叫答/黑板/纸条），V1.1 C 组件在 B 完成后废弃 |
| B-D2 | Rendering 技术栈 | **HTML divs + CSS grid + CSS @keyframes** (zero JS animation libs) — 抛弃原 SVG / framer-motion 方案。理由：mockup 已用 CSS grid 完整实现（`mockups/cn/classroom-overview.html`），CSS animation 比 framer-motion 更轻 + 零依赖 + 可访问性更好 |
| B-D3 | 视角 | **Front-view 教室** (学生在教室里面对老师) — 抛弃原 bird's-eye 俯瞰图。理由：mockup 是 front-view，更接近真实课堂体验 |
| B-D4 | DSL schema | **不动** — C 7 action 全部复用，业务逻辑 reducer + service 完全保留，只换 view 层 |
| B-D5 | ClassroomState | **不扩展** — B 模式复用 V1.1 ClassroomState 全部字段（包括 L1 seatLayout sort），新视觉通过 `seatLayout` 派生座位布局，不引入新 state 字段 |

---

## 1. Background

V1 + V1.1 shipped Classroom Mode C (interactive classroom shell)。C 用顶部 44px bar + 浮按钮 + 卡片实现"教室感"，但**学生 / 老师位置是抽象的**——ChatArea 里只有一个气泡，没有空间感。

**关键发现（2026-08-25 mockup review）**：
- `mockups/cn/classroom-overview.html` 已经用 CSS grid + HTML divs 完整实现了 B 模式视觉
- mockup 使用 front-view 布局（老师在顶部 + 黑板 + 学生横排面对老师），不是 bird's-eye 俯瞰图
- mockup 已实现所有 CSS 动画（pulse / wave / blink / bounce / speaking-pulse / spot-pulse / shake）
- mockup 已定义完整 CSS tokens (`--teacher #8b5cf6` / `--student-1 #ec4899` / `--student-2 #10b981` / `--student-3 #f59e0b` / `--me #3b82f6`)
- mockup 已实现 4 个交互态 (hand-raise 4 态 / call-on 4 态)

**修正决策**：B.1 直接把 mockup HTML 拆成 React 组件复用，不要重新设计。视觉已经设计完成，工程化（拆组件 + 接入 store + 测试）即可。

---

## 2. Goals

- **G1 空间感**：学生头像坐在课桌横排，面对老师 + 黑板；用户有"在教室里面对老师"的感觉
- **G2 互动真实感**（继承 mockup）：
  - 举手 = 学生头像挥手 + 角标 ✋ (CSS `.student-avatar.hand::before` + `@keyframes wave`)
  - 叫答 = 头像聚光 (CSS `.avatar.spotlight` + `@keyframes spot-pulse`) + 中心大字卡片 (CSS `.call-card`)
  - 纸条 = 同桌 SVG `<path>` 虚线 (`<svg class="whisper-line">`)
  - 黑板 = 整面投影 (`<div class="blackboard">` + chalk SVG)
- **G3 渐进迁移**：B 业务逻辑 100% 复用 V1 reducer + service + DSL actions，view 层替换为 mockup 组件
- **G4 零新依赖**：HTML + CSS + React 已足够，**不引** r3f/three/d3/framer-motion
- **G5 可访问性**：CSS `:focus-visible` + ARIA + 键盘导航；CSS animation 支持 `@media (prefers-reduced-motion)` 降级

---

## 3. Non-Goals

- N1 不做 3D（用户明确拒绝 R3F；mockup 已确认 front-view 足够）
- N2 不做俯瞰图 (bird's-eye) — 拒绝原 plan 的 SVG 路径，front-view 体验更真实
- N3 不做完整物理引擎（纸条飞行用 SVG 直线 / 抛物线 path，无碰撞检测）
- N4 不做多楼层 / 多教室（单教室单层平面）
- N5 不动 DSL schema（C 7 action 全部复用）
- N6 不动现有 reducer / service 业务逻辑
- N7 不破坏 Roundtable 三列布局（RoundTable 容器保留，**中央气泡区替换为 B 模式 front-view 教室**）
- N8 不引入新 state 字段（B 视觉通过 `seatLayout` + `agent_id` 派生）

---

## 4. State 扩展

**无新字段**。B 模式复用 V1.1 ClassroomState 全部字段：

| V1.1 字段 | B 模式用途 |
|---|---|
| `seatLayout` | 座位布局（前/中/后排 + 同桌关系）— B 模式按 `seatLayout` 渲染 4 列网格 |
| `handRaiseQueue` | 举手学生 — B 模式在对应学生头像加 `.hand` class + ✋ 角标 |
| `activeCallOn` | 叫答目标 — B 模式在该学生头像加 `.spotlight` class + 中心卡片 |
| `blackboardMode` | 黑板开关 — B 模式决定是否渲染整面投影 |
| `chalkStrokes` | 板书内容 — B 模式在黑板 SVG 内渲染 |
| `activeNote` | 纸条 — B 模式在两个同桌头像间画 SVG 虚线 |
| `period` / `lessonLabel` | 顶部 header pill 显示 |
| `agentRegistry` | 老师 / 学生档案（外部 store）— B 模式用 `agent_id` 查 emoji + 名字 |

---

## 5. UI 架构（基于 mockup `classroom-overview.html`）

### 5.1 B 模式主视图（替换 RoundTable 中央气泡区）

```
┌────────────────────────────────────────────────────┐
│ [Header 56px — V1 保留: hamburger + teacher pill   │
│                  + mode tabs + pomodoro + chat]    │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────── Main ──────────────────────────┐│
│  │                                                ││
│  │   ┌──────────────────────────────────────┐    ││
│  │   │ 📝 [黑板 顶部投影]                    │    ││
│  │   │   "异分母分数加法 / ① 先找公分母"     │    ││
│  │   └──────────────────────────────────────┘    ││
│  │                                                ││
│  │   [讲台] 👩‍🏫 老师头像 (60×60, speaking pulse)   ││
│  │           + 老师气泡 (max-width 360)            ││
│  │                                                ││
│  │   ┌────┐ ┌────┐ ┌────┐ ┌────┐                  ││
│  │   │💬小红│ │💬小亮│ │💬阿泽│ │💬 你 │ ← 课桌    ││
│  │   │👧✋ │ │👦💭 │ │👦💭 │ │📷   │   4列grid  ││
│  │   │小红│ │小亮│ │阿泽│ │你   │              ││
│  │   │🪑 │ │🪑 │ │🪑 │ │🪑 │ ← desk-table     ││
│  │   └────┘ └────┘ └────┘ └────┘                  ││
│  │                                                ││
│  │   [SVG whisper-line: 小红 ↔ 小亮 虚线]        ││
│  └────────────────────────────────────────────────┘│
│                                                    │
│  ┌──── Assignment (380px right) ──────────────────┐
│  │  📝 当前题目 / 📕 今日错题                     │
│  └────────────────────────────────────────────────┘
├────────────────────────────────────────────────────┤
│ [InputBar 64px — V1 保留: 拍题 + 文本输入 + 举手] │
└────────────────────────────────────────────────────┘
```

### 5.2 新组件清单（mockup HTML → React 组件映射）

| 组件 | mockup 对应 | 责任 |
|---|---|---|
| `<ClassroomFront />` | `<div class="classroom">` | 主 front-view 容器，组装 blackboard + teacher-stage + desks |
| `<FrontBlackboard />` | `<div class="blackboard">` | 整面投影区 + chalk SVG (V1 `buildChalkSvg` 复用) |
| `<TeacherStage />` | `<div class="teacher-stage">` | 讲台木纹 + 老师头像 + 老师气泡 (max 360) |
| `<TeacherAvatar />` | `<div class="teacher-avatar speaking">` | 60×60 圆头像 + 🎤 角标 + speaking pulse |
| `<Desks />` | `<div class="desks">` | 4 列 grid 容器 (`grid-template-columns: repeat(4, 1fr)`) |
| `<Desk />` | `<div class="desk">` | 单学生课桌：bubble + avatar + name + table |
| `<DeskBubble />` | `<div class="desk-bubble pink/green/amber/blue">` | 浮气泡 (position absolute) — 含 .thinking / .speaking 修饰 |
| `<StudentAvatar />` | `<div class="student-avatar hand/thinking/speaking">` | 50×50 头像 + ✋/💭/speaking ring |
| `<WhisperLine />` | `<svg class="whisper-line">` | 同桌 SVG path 虚线 |
| `<CallOnCard />` | `<div class="call-card">` | 中心大字叫答卡片（V1.1 已有，重命名避免冲突） |

### 5.3 V1.1 组件废弃清单

| V1.1 组件 | B 模式替换 | 废弃 commit |
|---|---|---|
| `<HandRaiseButton />` (V1.1) | `<Desk />` 上自带举手 (avatar.hand::before + wave animation) | B.4 cleanup |
| `<CallOnCard />` (V1.1) | `<CallOnCard />` (B 模式重写，front-view 中心卡片) — 文件路径改名 | B.4 cleanup |
| `<PassNote />` (V1) | `<WhisperLine />` SVG 虚线 + deskmate 提示 | B.4 cleanup |
| `<BlackboardChalkLayer />` (V1) | `<FrontBlackboard />` 整面投影 | B.4 cleanup |
| `<BlackboardToggle />` (V1) | 黑板自动 toggle (V1.1 M3 fix 保留) | B.4 cleanup |

### 5.4 CSS tokens（直接复用 mockup）

```css
:root {
  --bg: #f6f5fb;
  --fg: #1f1d2e;
  --muted: #6b6884;
  --line: #e6e4f0;
  --primary: #722ed1;
  --primary-soft: #efe6fb;
  --blackboard: #2d4a3a;
  --blackboard-text: #fef9e7;
  --teacher: #8b5cf6;
  --teacher-soft: #ede9fe;
  --student-1: #ec4899;
  --student-2: #10b981;
  --student-3: #f59e0b;
  --me: #3b82f6;
  --whisper: #fffbeb;
}
```

### 5.5 CSS @keyframes（直接复用 mockup）

- `pulse` — pomodoro dot 闪烁
- `wave` — 举手挥手 (-15deg ↔ 15deg)
- `bounce` — 思考气泡
- `blink` — 黑板光标
- `speaking-pulse` — 老师/学生发言光晕
- `spot-pulse` — 叫答聚光（V1.1 M4 mockup 命名）

---

## 6. 交互流（继承 mockup 4 状态）

### 6.1 举手（mockup hand-raise.html）
- **状态 1 default** — 右下角浮按钮灰色边框未激活
- **状态 2 modal** — 点击展开输入框 + 提交按钮；其他学生头像角标 ✋
- **状态 3 queued** — 浮按钮橙色 + badge 显示队列长度 + 上面列表展示顺序（FIFO）
- **状态 4 cue_user fallback** — 队列 ≥ 3 自动转 cue_user；最早举手者被叫

### 6.2 叫答（mockup call-on.html）
- **状态 1 call_on 触发** — 中心大字卡片 "📣 老师叫你回答 / 👧 小红" + 5s 倒计时；目标头像聚光 + 其他 dim
- **状态 2 倒计时归零** — timer 红色 shake → 自动 cue_user fallback
- **状态 3 target offline** — 头像灰色 line-through → 跳过到下一个举手者
- **状态 4 成功回答** — 卡片 dismiss → answering toast (绿色 ring + dot)

### 6.3 纸条（mockup overview.svg whisper-line）
- student A 点 student B 头像 → dispatch `pass_note` (V1 reducer inert)
- UI：从 A 头像到 B 头像画 SVG `<path>` 虚线（repeating-linear-gradient）
- B 头像显示"📩 有纸条"角标

### 6.4 黑板板书（mockup c3 blackboard）
- teacher 在 `<FrontBlackboard />` 写字 → dispatch `blackboard_annotate` (V1 已有)
- V1.1 M3 fix 自动 toggle + toast 警告（保留）
- UI：黑板区域渲染 chalk SVG (V1 `buildChalkSvg` 复用)

### 6.5 移动
- N4：teacher 不移动（固定 podium）
- student 不可移动座位（除非 V1.1 M2 admin override）

---

## 7. DSL 增量

**无新增 action**。B 模式复用 V1 全部 7 action：
- `period_start` / `period_end` / `period_bell`
- `raise_hand` / `call_on` / `pass_note`
- `blackboard_annotate`

action payload 也无需扩展（mockup 视觉通过 store 现有字段 + agent registry 派生）。

---

## 8. State 派生（无 reducer 改造）

B 模式不需要新增 reducer helper。视觉派生规则：

| 视觉元素 | 派生源 |
|---|---|
| 学生头像位置 | `seatLayout` 数组顺序 → 4 列 grid (V1.1 L1 sort by [zone, seatIndex, raised_at]) |
| 学生头像颜色 | `seatIndex % 4` → `--student-1/2/3/me` |
| 学生名字 / emoji | `agentRegistry[agent_id]` (外部 store) |
| 举手状态 | `handRaiseQueue.find(h => h.agent_id === seat.agent_id)` → avatar 加 `.hand` class |
| 叫答状态 | `activeCallOn?.target_agent_id === seat.agent_id` → avatar 加 `.spotlight` class + 中心卡片 |
| 纸条路径 | `activeNote?.from_seat` + `to_seat` → SVG `<path d>` |
| 黑板内容 | `chalkStrokes` + `blackboardMode` → chalk SVG render |
| 老师 emoji | 硬编码 `👩‍🏫` 或从 agent registry 读 teacher agent |
| 学生 emoji | agent registry `avatar_emoji` 字段 |

---

## 9. 失败处理（继承 V1 + V1.1 + 新增 B 场景）

| 场景 | 处理 | 来源 |
|---|---|---|
| 头像 emoji 缺失 | fallback 到 `agent_id.charAt(0).toUpperCase()` | B 新增 |
| `agentRegistry[agent_id]` undefined | fallback 到默认 emoji `🧒` + 默认名 "学生" | B 新增 |
| `seatLayout` 空 | 降级到 V1.1 静态布局（顶部 bar + 浮按钮） | B 新增 |
| `prefers-reduced-motion: reduce` | 禁用 wave / speaking-pulse / spot-pulse animation | B 新增 |
| 移动端 <640px | desks grid 自动 `grid-template-columns: repeat(2, 1fr)` + 老师气泡 max-width 200 | B 新增 |
| 键盘导航 (Tab → desk → Enter 举手) | `<Desk tabIndex={0} role="button" onKeyDown={Enter→raise_hand}>` | B 新增 |

---

## 10. 兼容性

- **10.1 DSL 兼容** — 0 增量，B 复用 V1 schema，老场景 JSON 0 改动
- **10.2 状态兼容** — ClassroomState 无新字段，老 store 0 migration
- **10.3 配置兼容** — `NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED` flag 继续生效；新增 `NEXT_PUBLIC_CLASSROOM_MODE_B_ENABLED` flag (默认 false，让独立 release gate)
- **10.4 UI 兼容** — RoundTable 容器保留，中央气泡区替换为 `<ClassroomFront />`；ChatArea / CanvasArea / SceneSidebar 0 改动
- **10.5 i18n 兼容** — 复用 V1 `classroom.*` 字典，新增 `classroom.front.*` namespace（座位标签 / 举手 / 叫答 / 纸条 / 黑板）

---

## 11. Phase 划分（4 phase, ~4 天 total, 比原 plan 少 1 天)

### Phase B.1 (MVP, ~1.5 天 / 3 task)
1. Task B.1.1 — CSS tokens + `<ClassroomFront />` 主容器 + `<FrontBlackboard />` + `<TeacherStage />` + `<TeacherAvatar />` 拆组件
2. Task B.1.2 — `<Desks />` + `<Desk />` + `<DeskBubble />` + `<StudentAvatar />` 拆组件 + 接入 `seatLayout` store
3. Task B.1.3 — `<WhisperLine />` SVG path + feature flag + visual snapshot baselines (M4 follow-up pattern) + integration test

**B.1 ship milestone**：用户看到 front-view 教室（黑板 + 老师 + 学生课桌 + 静态 — 无举手/叫答/纸条交互，V1.1 C 组件仍显示）

### Phase B.2 (~1 天 / 2 task)
1. Task B.2.1 — `<CallOnCard />` 重写 (front-view 中心卡片) + 接入 `activeCallOn` store + 头像 `.spotlight` 联动
2. Task B.2.2 — 学生 avatar `.hand` class + ✋ 角标 + wave animation (复用 mockup CSS)

**B.2 ship milestone**：举手 + 叫答完整交互，纸条仍 V1.1 实现

### Phase B.3 (~1 天 / 2 task)
1. Task B.3.1 — `<WhisperLine />` 接入 `activeNote` store + 同桌 SVG path 联动
2. Task B.3.2 — keyboard navigation + ARIA + visual snapshot 更新 (加入 4 交互态 baseline)

**B.3 ship milestone**：B 模式完整功能 + a11y + 视觉回归保护

### Phase B.4 (~0.5 天 / 1 task)
1. Task B.4.1 — V1.1 C 组件移除 + PeriodBar 简化（顶部只剩时间）+ snapshot 更新

**B.4 ship milestone**：B 模式默认模式，C 组件从 codebase 删除

---

## 12. 测试策略（继承 V1 + V1.1 + B 新增）

| 层 | 内容 | 来源 |
|---|---|---|
| 单元 | CSS class derivation (`getAvatarClass(seatIndex)`) | B.1 |
| 组件 | `<Desk />` / `<StudentAvatar />` / `<WhisperLine />` 各 2-3 cases | B.1-B.3 |
| 集成 | `e2e/tests/classroom-front.spec.ts` — 完整 B 模式剧本 (类比 V1 §8 e2e) | B.3 |
| 视觉回归 | `e2e/tests/front-snapshots.spec.ts` — 5-7 cases (front-view 全景 + 4 交互态) | B.1-B.3 |
| 可访问性 | keyboard navigation + prefers-reduced-motion 测试 | B.3 |

---

## 13. References

- **Mockup (主参考)**: `mockups/cn/classroom-overview.html` — front-view 教室完整视觉
- **Mockup (交互态)**: 
  - `mockups/cn/classroom-hand-raise.html` — 举手 4 态
  - `mockups/cn/classroom-call-on.html` — 叫答 4 态
  - `mockups/cn/classroom-pass-note.html` — 纸条
  - `mockups/cn/classroom-blackboard.html` — 黑板
- **Mockup (V1 探索)**: `mockups/classroom-layout-c3.html` — V1 V1.1 实施的中间布局
- V1 spec: [`specs/shared/classroom-mode-design.md`](./classroom-mode-design.md) (✅ shipped 2026-08-25)
- V1.1 spec: [`specs/shared/classroom-mode-design.md` §11](./classroom-mode-design.md) (✅ shipped 2026-08-25)
- V1.1 plan: [`specs/cn/plans/2026-08-25-classroom-mode-v1.1.md`](../cn/plans/2026-08-25-classroom-mode-v1.1.md)
- V1 plan: [`specs/cn/plans/2026-08-25-classroom-mode.md`](../cn/plans/2026-08-25-classroom-mode.md)

---

## 14. 自检 (2026-08-25 revised)

- [x] **Placeholder scan**: 0 TBD / TODO / "implement later"
- [x] **Internal consistency**: state 扩展 (none) / DSL 不动 / reducer 不动 / view mockup-based 一致
- [x] **Scope check**: B 拆 4 phase, 每 phase ≤ 3 task, 每 plan ≤ 12 task
- [x] **Ambiguity check**: B-D1 至 B-D5 共 5 个决策点全部 locked
- [x] **Mockup fidelity**: 5 关键 mockup 全部 reference，CSS tokens + animations 直接复用
- [x] **Predecessor traceability**: V1 §11 演化表 7 条全部映射到 B 新组件 (基于 front-view, 非俯瞰图)
