# OpenMAIC · Classroom Mode B (Spatial Topdown) Design

**Date**: 2026-08-25
**Status**: ✅ **User approved (2026-08-25)** · Pending writing-plans
**Scope**: Engine-level feature · CN + INTL both use · Phase B (post-V1.1)
**Approach chosen**: **B · 2D SVG Topdown Viewport** (anchor = spatial classroom representation, full C parity)
**Spec owner**: TBD
**Implementation**: ~2 days for B.1 MVP, 4-5 days total for B.1-B.3
**Predecessor**: [classroom-mode-design.md](./classroom-mode-design.md) (V1 ✅ shipped, V1.1 ✅ shipped 2026-08-25)

---

## 0. User Decisions Log (2026-08-25)

| # | 议题 | 决策 |
|---|---|---|
| B-D1 | B 模式 vs V1.1 C 模式关系 | **仅 B, C 弃用** — B 完整包含 C 所有交互（举/叫答/黑板/纸条），V1.1 C 组件在 B 完成后废弃 |
| B-D2 | Rendering 技术栈 | **2D SVG + framer-motion**（已有依赖） — 拒绝 R3F/Canvas 3D（教育场景下清晰度优先 + 零新依赖原则） |
| B-D3 | RoundTable 中央气泡区 | **替换为俯瞰图** — 俯瞰图就是中央气泡区的 B 模式化身 |
| B-D4 | DSL schema | **不动** — C 7 action 全部复用，业务逻辑 reducer + service 完全保留，只换 view 层 |
| B-D5 | ClassroomState | **扩展（平铺）** — 新增 `seatPositions` / `podiumPosition` 空间坐标；现有 handRaiseQueue / activeCallOn / blackboardMode / activeNote / chalkStrokes 全部保留 |

---

## 1. Background

V1 + V1.1 shipped Classroom Mode C (interactive classroom shell). C 用顶部 44px bar + 浮按钮 + 卡片实现"教室感"，但**学生 / 老师位置是抽象的**——ChatArea 里只有一个气泡，没有空间感。

用户问"如何更像真实教室"，V1 → V1.1 解决了"有铃声/举手/黑板"，但没解决"看到谁在哪"。B 模式升级为空间俯瞰图：学生头像坐在座位上，举手时头像旁动态举手图标，老师能扫一眼看到"张三李四在举手"。

V1 spec §11 已为 B 演化做预留：所有 ClassroomState 字段平铺在顶层，未来可直接迁移到 3D canvas。本 spec 用 2D SVG 实现 B（推荐方案），业务逻辑零改动。

---

## 2. Goals

- **G1 空间感**：学生头像按 seat 坐标放在 1000×600 SVG 上，老师/学生/旁观者一眼看出谁在哪
- **G2 互动真实感**：举手 = 头像旁举手图标（不依赖浮按钮）；叫答 = spotlight 走线指向被叫学生；纸条 = SVG animateMotion 沿真实路径飞行；黑板 = 整面 SVG 投影墙
- **G3 渐进迁移**：B 业务逻辑 100% 复用 V1 reducer + service + DSL actions，view 层替换；V1.1 C 组件（PeriodBar / HandRaiseButton / CallOnCard / PassNote / BlackboardChalkLayer）在 B.4 cleanup 阶段移除
- **G4 零新依赖**：用 SVG + 现有 framer-motion（V1 已有），不引 r3f/three/d3
- **G5 可访问性**：SVG 加 ARIA + 键盘导航（举手 = Enter 键）；3D Canvas 做不到

---

## 3. Non-Goals

- N1 不做 3D（用户明确拒绝 R3F；未来如果真要 3D，业务逻辑不变，只换 view 层）
- N2 不做完整物理引擎（纸条飞行用 SVG `animateMotion` + 2D 直线 / 抛物线，无碰撞检测）
- N3 不做多楼层 / 多教室（单教室单层平面）
- N4 不做老师移动（teacher 固定在 podium 位置）
- N5 不动 DSL schema（C 7 action 全部复用）
- N6 不动现有 reducer / service 业务逻辑
- N7 不破坏 Roundtable 三列布局（RoundTable 容器保留，**中央气泡区替换为俯瞰图**）

---

## 4. State 扩展

继承 V1 ClassroomState + 新增空间字段：

```typescript
// lib/store/classroom-state.ts (扩展, 不破坏 V1)
export interface ClassroomState {
  // === V1 全部保留 ===
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
  activeNote?: ActiveNote | null;
  chalkStrokes?: ChalkStroke[];
  lastInputChannel?: 'text' | 'voice' | 'raise_hand' | null;

  // === B 新增 (平铺, 便于未来 3D 迁移) ===
  seatPositions?: Record<string, { x: number; y: number }>; // 0-1000 归一化坐标
  podiumPosition?: { x: number; y: number };              // 讲台坐标
  viewportSize?: { width: number; height: number };       // SVG 视口
}
```

**关键决策**：所有 B 新字段 `?:` optional，老场景无 B 数据时降级到 V1 默认布局（俯瞰图组件 render null + V1 组件 fallback）。

---

## 5. UI 架构

### 5.1 B 模式主视图（替换 RoundTable 中央气泡区）

```
┌─────────────────────────────────────────────────┐
│ [PeriodBar 顶部 44px — V1 保留]                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │   📝 [黑板投影 1000×200]                  │    │
│  │                                         │    │
│  │   👨‍🏫 [讲台 podium 中心]                   │    │
│  │                                         │    │
│  │   🧑 A1  🧑 A2  🧑 A3  🧑 A4             │    │
│  │   🧑 B1  🧑 B2  🧑 B3  🧑 B4             │    │
│  │   🧑 C1  🧑 C2  🧑 C3  🧑 C4             │    │
│  │                                         │    │
│  │   ✋ = 举手图标（学生头像旁动态）          │    │
│  │   💡 = spotlight 光环（被叫学生）         │    │
│  │   📃 = 飞行纸条（SVG animateMotion）       │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
├─────────────────────────────────────────────────┤
│ [ChatArea — V1 保留]                              │
└─────────────────────────────────────────────────┘
```

### 5.2 新组件清单

| 组件 | 路径 | 责任 |
|---|---|---|
| `<ClassroomTopdown />` | `components/classroom-shell/topdown/index.tsx` | 主 1000×600 SVG 容器，组装所有 topdown 子组件 |
| `<TopdownSeat />` | `components/classroom-shell/topdown/seat.tsx` | 单个学生座位 (circle avatar + name + hand-raise icon + spotlight halo) |
| `<TopdownBlackboard />` | `components/classroom-shell/topdown/blackboard.tsx` | 黑板投影区 (rect 1000×200, chalk SVG) |
| `<TopdownPodium />` | `components/classroom-shell/topdown/podium.tsx` | 讲台 + teacher avatar |
| `<TopdownHandRaiseIndicator />` | `components/classroom-shell/topdown/hand-raise.tsx` | 头像旁的动态举手图标 (framer-motion bounce) |
| `<TopdownSpotlight />` | `components/classroom-shell/topdown/spotlight.tsx` | 叫答 spotlight 走线 (SVG path animate) |
| `<TopdownPaperNote />` | `components/classroom-shell/topdown/paper-note.tsx` | 飞纸条 (SVG `animateMotion` + 2D 抛物线路径) |
| `<useSeatPositions()>` | `lib/hooks/use-seat-positions.ts` | Hook: 默认布局生成器 + admin override 路径 |
| `<TopdownSeatLayoutAdmin />` | `components/admin/topdown-seat-editor.tsx` | V1.1 M2 admin editor 升级支持拖拽座位 (Phase B.3) |

### 5.3 V1.1 组件废弃清单

| V1.1 组件 | B 模式替换 | 废弃 commit |
|---|---|---|
| `<HandRaiseButton />` | `<TopdownHandRaiseIndicator />` | B.4 cleanup |
| `<CallOnCard />` | `<TopdownSpotlight />` + 头像光环 | B.4 cleanup |
| `<PassNote />` (V1) | `<TopdownPaperNote />` | B.4 cleanup |
| `<BlackboardChalkLayer />` | `<TopdownBlackboard />` | B.4 cleanup |
| `<BlackboardToggle />` | B 模式自动 toggle (per V1.1 M3) | B.4 cleanup |

---

## 6. 交互流（B 模式）

### 6.1 举手
- 用户点击某个学生头像旁的"✋"图标 → dispatch `raise_hand` action (V1 已有)
- reducer 排序（L1 V1.1 已有）：`[zone, seatIndex, raised_at]`
- UI 反馈：头像旁出现动态举手图标（framer-motion bounce + 🔔 提示音 V1 已有）

### 6.2 叫答
- teacher 选中举手学生 → dispatch `call_on` action (V1 已有)
- UI 反馈：从 podium 到目标座位画 spotlight 走线（SVG `<path>` + `stroke-dasharray` 动画），目标座位头像加光环

### 6.3 传纸条
- student A 点 student B 头像 → dispatch `pass_note` (V1 已有，reducer inert)
- UI 反馈：从 A 头像 SVG `<animateMotion>` 沿抛物线飞到 B 头像，B 头像显示"📩 有纸条"

### 6.4 黑板板书
- teacher 在 `<TopdownBlackboard />` 上写字 → dispatch `blackboard_annotate` (V1 已有)
- reducer V1.1 M3 fix 自动 toggle + toast 警告（V1.1 已有）
- UI 反馈：黑板区域渲染 chalk SVG (V1 已有 `buildChalkSvg`)

### 6.5 移动
- N4：teacher 不移动（固定 podium）
- student 不可移动座位（除非 admin override per V1.1 M2）

---

## 7. DSL 增量

**无新增 action**。B 模式复用 V1 全部 7 action：
- `period_start` / `period_end` / `period_bell`
- `raise_hand` / `call_on` / `pass_note`
- `blackboard_annotate`

action payload 也无需扩展（B 新增字段通过 reducer 派生的 `seatPositions` / `podiumPosition` 算出来，不参与 wire format）。

---

## 8. State 派生（reducer 改造）

`seatPositions` 和 `podiumPosition` 不通过 action 写入，而是 reducer 根据 `seatLayout` 自动派生：

```typescript
// reducer 内部 helper
function deriveSeatPositions(seatLayout: SeatConfig[]): Record<string, {x:number;y:number}> {
  // 默认网格: 4 列 × N 行, 0-1000 归一化
  // A1 = (125, 500), A2 = (375, 500), ..., B1 = (125, 600), ...
  // column pitch = 250, row pitch = 100
  // ...
}
```

reducer 在 `case 'period_start'` 和 `case 'raise_hand'` 末尾调用 `deriveSeatPositions(state.seatLayout)` 重新派生，存储到 `state.seatPositions`。

---

## 9. 失败处理（继承 V1 + V1.1 + 新增 B 场景）

| 场景 | 处理 | 来源 |
|---|---|---|
| 头像加载失败 | 用首字母 fallback (eg "Z" for 张三) | B 新增 |
| SVG 渲染性能问题（>50 学生） | 自动 reduce 头像文字大小 + 关闭 chalk turbulence filter | B 新增 |
| 用户键盘导航 (Tab → 头像 → Enter 举手) | `<g role="button" tabIndex={0} onKeyDown={Enter→raise_hand}>` | B 新增 |
| 移动端 <640px | 自动缩放 SVG 到 50% (V1.1 L4 media query) | B 新增 |
| B 模式组件挂载但 seatPositions 未派生 | 降级到 V1 默认布局（顶部 bar + 浮按钮） | B 新增 |

---

## 10. 兼容性

- **10.1 DSL 兼容** — 0 增量，B 复用 V1 schema，老场景 JSON 0 改动
- **10.2 状态兼容** — ClassroomState 新增字段全 optional，老 store 0 migration
- **10.3 配置兼容** — `NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED` flag 继续生效；新增 `NEXT_PUBLIC_CLASSROOM_MODE_B_ENABLED` flag (默认 false，让独立 release gate)
- **10.4 UI 兼容** — RoundTable 容器保留，中央气泡区替换为 `<ClassroomTopdown />`；ChatArea / CanvasArea / SceneSidebar 0 改动
- **10.5 i18n 兼容** — 复用 V1 `classroom.*` 字典，新增 `classroom.topdown.*` namespace（座位标签 / 举手 / 叫答 / 纸条 / 黑板）

---

## 11. Phase 划分（4 phase, ~5 天 total）

### Phase B.1 (MVP, ~2 天 / 4 task)
1. Task B.1.1 — `<ClassroomTopdown />` 主容器 + SVG 视口 + 学生座位默认网格布局（无交互）
2. Task B.1.2 — `deriveSeatPositions()` reducer helper + `seatPositions` 派生
3. Task B.1.3 — `<TopdownSeat />` 学生头像组件 + 首字母 fallback
4. Task B.1.4 — `<TopdownPodium />` 讲台组件 + teacher avatar

**B.1 ship milestone**：用户能看到静态俯瞰图（学生头像 + 讲台），无举手/叫答/黑板交互（V1.1 C 组件仍显示）

### Phase B.2 (~1.5 天 / 3 task)
1. Task B.2.1 — `<TopdownHandRaiseIndicator />` + reducer 集成（点击头像旁图标 → raise_hand）
2. Task B.2.2 — `<TopdownSpotlight />` 叫答走线 + 头像光环
3. Task B.2.3 — `<TopdownBlackboard />` 黑板投影区

**B.2 ship milestone**：完整互动（举/叫答/黑板），C 组件仍显示但被 B 覆盖

### Phase B.3 (~1.5 天 / 3 task)
1. Task B.3.1 — `<TopdownPaperNote />` SVG animateMotion 飞纸条
2. Task B.3.2 — `<TopdownSeatLayoutAdmin />` admin 拖拽座位编辑器
3. Task B.3.3 — B 模式 keyboard navigation + ARIA + visual snapshot baselines (M4 follow-up pattern)

**B.3 ship milestone**：B 模式完整功能 + a11y + 视觉回归保护

### Phase B.4 (~0.5 天 / 1 task)
1. Task B.4.1 — V1.1 C 组件移除 + PeriodBar 简化（顶部只剩时间）+ snapshot 更新

**B.4 ship milestone**：B 模式默认模式，C 组件从 codebase 删除

---

## 12. 测试策略（继承 V1 + V1.1 + B 新增）

| 层 | 内容 | 来源 |
|---|---|---|
| 单元 | `deriveSeatPositions()` reducer helper + sort key integration | B.1 |
| 组件 | `<TopdownSeat />` / `<TopdownBlackboard />` / `<TopdownSpotlight />` 各 2-3 cases | B.1-B.2 |
| 集成 | `e2e/tests/classroom-topdown.spec.ts` — 完整 B 模式剧本 (类比 V1 §8 e2e) | B.3 |
| 视觉回归 | `e2e/tests/topdown-snapshots.spec.ts` — 7-10 cases (类比 V1.1 M4 模式) | B.3 |
| 可访问性 | axe-core 自动 a11y 测试 (复用 V1 框架) | B.3 |

---

## 13. References

- V1 spec: [`specs/shared/classroom-mode-design.md`](./classroom-mode-design.md) (✅ shipped 2026-08-25)
- V1.1 spec: [`specs/shared/classroom-mode-design.md` §11](./classroom-mode-design.md) (✅ shipped 2026-08-25 — V1.1 deferred M2/M4 + L1-L4)
- V1.1 plan: [`specs/cn/plans/2026-08-25-classroom-mode-v1.1.md`](../cn/plans/2026-08-25-classroom-mode-v1.1.md)
- V1 plan: [`specs/cn/plans/2026-08-25-classroom-mode.md`](../cn/plans/2026-08-25-classroom-mode.md)
- Mockup: `mockups/classroom-layout-c3.html` (V1 已探索的 C3 俯瞰图布局)
- §11 V1 预留 (C → B 演化表) 全部继承

---

## 14. 自检 (2026-08-25)

- [x] **Placeholder scan**: 0 TBD / TODO / "implement later"
- [x] **Internal consistency**: state 扩展 / DSL 不动 / reducer 派生 vs action 写入 一致
- [x] **Scope check**: B 拆 4 phase, 每 phase ≤ 4 task, 每 plan ≤ 12 task
- [x] **Ambiguity check**: B-D1 至 B-D5 共 5 个决策点全部 locked
- [x] **Predecessor traceability**: V1 §11 演化表 7 条全部映射到 B 新组件
