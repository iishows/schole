# OpenMAIC · Classroom Mode (C) Design

**Date**: 2026-08-25
**Status**: ✅ **User approved (2026-08-25)** · Pending writing-plans
**Scope**: Engine-level feature · CN + INTL both use · V1 ship
**Approach chosen**: **C · Interactive Classroom Shell** (anchor = interaction + light classroom chrome)
**Spec owner**: TBD
**Implementation**: 5 weeks parallel with CN MVP W1-W7

---

## 0. User Decisions Log (2026-08-25)

| # | 议题 | 决策 |
|---|---|---|
| D-1 | 何时上 | **V1 与 CN MVP 同步上线**（不进 V1.1） |
| D-2 | seatLayout 配置 | **两者结合**：Director 自动生成默认布局（"邻座 = 同桌"），admin 后台可 override |
| D-3 | INTL 兼容 | **V1 兼容**：UI 文案翻译成 INTL 语义（"homeroom / circle time / morning basket"），功能 100% 复用 |

---

## 1. 背景

### 1.1 用户痛点
- 用户反馈：当前 OpenMAIC "像 AI 聊天（学生在 ChatArea 打字，AI 在同窗回复气泡）"
- 想要：更像真实**教室**——空间感、举手/叫答、走动、黑板、铃声、课本、同桌、时间系统

### 1.2 现状
- `components/roundtable/index.tsx`（2141 行）：底部 3 列（教师身份 + 中央气泡区 + 学生 + 用户头像）
- 已有：`cue_user`（agent 提示用户回答）+ `discussionRequest`（学生 agent 主动插话）
- 已有 presentation mode（全屏投影版教师）
- DSL 共 22 个 action（含 `speech` / `spotlight` / `wb_draw_shape`，无时间/空间/座位 action）
- 已有 spec：`mockups/classroom-layout-c3.html`（C3 实地布局探索，未集成）

### 1.3 设计目标
1. **不破坏**现有 Socratic 对话 / scene / playback 兼容
2. **覆盖全部 8 个教室元素**（除"走动"用动效代替实际位移）
3. **4-6 周内上线**，不影响 CN MVP W1-W7 主计划
4. **V1.1 平滑演化到 B（空间模式）**——架构预留

---

## 2. 心智模型重构

| 现有概念 | 重命名 / 重定位 | 用户感知 |
|---|---|---|
| teacherParticipant | **老师**（讲台固定） | 唯一讲师 |
| studentParticipants | **同学**（座位固定） | 同桌 + 邻桌 |
| userParticipant | **我**（固定座位） | "我"被点名、"我"举手 |
| `cue_user` | **老师叫我回答** | 高亮 + 琥珀脉冲 |
| `discussionRequest` | **某同学举手** | 橙黄呼吸 + ProactiveCard |
| scene | **课节 / 单元** | SceneSidebar 重命名 |
| mic/text 按钮 | **举手 / 安静抢答** | 加 🔔 显式"我也要说" |

**关键变化**：用户从"AI 聊天操作员"变成"教室里那个真实孩子"。

---

## 3. DSL 增量动作集（7 个新 action）

### 3.1 现有 22 个 action 全部保留

`speech` / `spotlight` / `wb_draw_shape` 等不破坏。

### 3.2 新增 7 个（与 Segment 1 一致）

| Action | 触发者 | UI 表现 | 数据结构 |
|---|---|---|---|
| `period_start` | Director | 顶部上课铃响 + 状态栏变化 | `{period: "Lesson-1", duration: 2700, agenda: ["导入","新授","练习","总结"]}` |
| `period_end` | Director | 下课铃 + 切换到课间模式 | `{break_duration: 600}` |
| `period_bell` | 系统 | 单次铃响 + 短震动 | `{type: "transition"\|"attention"\|"wrap"}` |
| `raise_hand` | 用户 / 同学 agent | 头像举手 + 举手队列气泡 | `{agent_id, question?: string, ts: number}` |
| `call_on` | 老师 agent | "请 X 回答"卡片 + X 头像聚光 | `{target_agent_id, prompt: string, ts: number}` |
| `pass_note` | 同学 agent | 纸条从一桌飞向邻桌 | `{from_seat: string, to_seat: string, content: string, animation: "fly"}` |
| `blackboard_annotate` | 任何角色 | Canvas 顶部"白板"模式生效 | `{layer: "blackboard", path: Stroke[], duration: number}` |

### 3.3 Action 语义补充

**`raise_hand`** vs 现有的 `discussionRequest`:
- `discussionRequest`：**被动**触发（agent 自己要说话）
- `raise_hand`：**主动**触发（用户/agent 显式"我要说"），进入**举手队列**

**`call_on`** vs 现有的 `cue_user`:
- `cue_user`：宽泛"请你回答"
- `call_on`：**指定 agent**（"请 4 号桌 小红 回答"），并把 X 头像聚光

**`pass_note`**：仅在 `seatLayout` 已配置为"邻桌"时可用（见 §4 状态机）

**`blackboard_annotate`**：调用时自动把 canvas 切换为"白板层"，不依赖 UI toggle。但 UI 上同时提供手动 toggle 供用户切换。

### 3.4 Action schema 校验要求

每个新 action 必须：
- 有 `id` / `type` / `agent_id` / `target_agent_id?` / `timestamp` 字段
- 通过 `lib/dsl/action-schema-validator` 单测覆盖
- 有 mock JSON fixture（用于 Playwright e2e）

---

## 4. 状态机扩展

### 4.1 新增 `ClassroomState`

```ts
type ClassroomPeriod = 'before-class' | 'lesson' | 'break' | 'after-class';

interface ClassroomState {
  period: ClassroomPeriod;
  periodStartedAt: number;        // unix ms
  periodEndsAt: number;            // unix ms
  lessonLabel: string;             // e.g. "人教版 4 年级数学 · 异分母分数加法"
  handRaiseQueue: HandRaise[];     // FIFO
  activeCallOn: CallOn | null;    // 当前被叫到谁（独占）
  blackboardMode: boolean;         // canvas 当前是白板 / 幻灯片
  seatLayout: SeatConfig[];        // 座位表（决定同桌关系）
  bellQueue: BellEvent[];          // 待播放的铃事件
}

interface HandRaise {
  agent_id: string;
  agent_name: string;
  raised_at: number;
  question?: string;
  origin: 'user' | 'agent';
}

interface SeatConfig {
  seat_id: string;                 // "A1"
  agent_id: string;
  deskmates: string[];             // 邻桌 agent_id（用于 pass_note）
  zone: 'front' | 'middle' | 'back';
}

interface BellEvent {
  type: 'transition' | 'attention' | 'wrap';
  scheduled_at: number;
}
```

### 4.2 状态转移表（部分关键）

| From | Trigger | To |
|---|---|---|
| `before-class` | 用户点击"进入教室" | `lesson` |
| `lesson` | `period_end` 触发 | `break` |
| `lesson` | `period_end` 且 `isLastLesson` | `after-class` |
| `break` | `period_start` 触发 | `lesson` |
| 任意 | Director 抛 error | 保持当前 + 错误 toast |

### 4.3 不动现有 Stage / Scene / Playback 状态

新 `ClassroomState` 是**正交**扩展（不修改现有 playbackView / sourceText），仅追加新字段。

---

## 5. UI 改动（最小侵入）

### 5.1 顶部新增 Period Bar（高 44px）

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔔 第 3 节 · 异分母分数加法              [▶] ⏸ ⏮ ⏭   ⏱ 32:14  │
└─────────────────────────────────────────────────────────────────┘
```

- 左侧：当前 period + 课程名
- 右侧：playback 控件 + 倒计时（mm:ss）
- `period_end` 时整体变琥珀色 + 铃图标闪动

### 5.2 RoundTable 中央新增 HandRaise 浮按钮（直径 48px）

- 默认：右下角漂浮，灰色 + 🔔 图标
- 点击：展开输入气泡（"你想问什么？"）
- 队列进入后：按钮变橙色 + 数字徽章
- 老师 `call_on` 时：自动 dismiss

### 5.3 CallOn 卡片（用现有 ProactiveCard，加新 mode）

- 老师说"请小红回答" → ProactiveCard 显示：
  - 头像 + "小红"
  - 问题 prompt
  - "准备回答" 倒计时（3-5s 可配）
- 倒计时归零或小红回答后 → 自动 dismiss

### 5.4 Pass Note 动画

- `pass_note` action 触发时：
  - 起点：发方头像，弹出小纸条 SVG
  - 沿贝塞尔曲线飞向邻桌
  - 到达后：气泡浮起在收方头像上方 3s
  - 同时收方 agent 收到 `disc_drive` hint，可选择回应（也是 `pass_note` 或 `speech`）

### 5.5 Blackboard Mode Toggle（Canvas 顶部 tab）

```
┌─────────────────────────────────────────┐
│  📑 幻灯片  │  📝 白板  │  📊 测验       │
└─────────────────────────────────────────┘
```

- "白板" 模式：canvas 显示协作白板 + chalk-style 笔触
- 任何角色（包括用户）调用 `blackboard_annotate` 都会在白板层加一笔
- 保留现有 widget/slide 渲染不变

### 5.6 RoundTable 视觉框架完全不变

3 列（左 教师身份 / 中央 气泡+输入+举手 / 右 学生头像 + 用户头像）—— **零修改**。

---

## 6. 5 周增量实施

### W1 · 时间容器（Period Bar + 铃声）

| Task | Est | Owner |
|---|---|---|
| T1: `<PeriodBar>` 组件 + 与现有 playback 控件并存 | 1d | FE |
| T2: 3 个 DSL action（period_start/end/bell）+ schema validator | 0.5d | DSL |
| T3: ClassroomState 接入 useStageStore（含 reducer） | 0.5d | FE+store |
| T4: 倒计时（mm:ss）+ period transition 动画 | 0.5d | FE |
| T5: 单测 + e2e（一节课完整流程）| 0.5d | QA |

**交付**：顶部 period bar 工作，period_end 自动转 break。

### W2 · 举手（Hand-Raise + raise_hand）

| Task | Est | Owner |
|---|---|---|
| T1: 浮按钮 `<HandRaiseButton>` + 队列 toast | 1d | FE |
| T2: `raise_hand` DSL action + 队列 reducer | 0.5d | DSL+store |
| T3: Director graph 加 raise_hand 节点（agent 主动举手）| 0.5d | Director |
| T4: 与现有 discussionRequest 的优先级（raise_hand > discussion）| 0.5d | FE |
| T5: 队列满 3 人时自动转 `cue_user` 给最久的 | 0.5d | logic |

**交付**：用户可显式举手，agent 也可举手，队列有秩序。

### W3 · 叫答（Call-On 卡片）

| Task | Est | Owner |
|---|---|---|
| T1: `<CallOnCard>` 用 ProactiveCard 加 `mode="call_on"` | 1d | FE |
| T2: `call_on` DSL action | 0.5d | DSL |
| T3: 头像聚光（spotlight 现有机制复用）| 0.5d | FE |
| T4: 倒计时归零自动跳 cue_user fallback | 0.5d | FE |
| T5: 单元测试 + e2e | 0.5d | QA |

**交付**：老师可说"请 X 回答"，X 头像聚光 + 准备倒计时。

### W4 · 同桌（Pass Note）

| Task | Est | Owner |
|---|---|---|
| T1: `ClassroomLayoutService.autoGenerate()`（默认"邻座=同桌"算法）| 0.5d | engine |
| T2: admin settings UI（可选 override 单个座位） | 0.5d | admin |
| T3: `pass_note` DSL action | 0.5d | DSL |
| T4: 飞纸条动画（贝塞尔曲线）+ 收方 hint | 1d | FE |
| T5: 同桌收方默认触发 `speech` 回应 | 0.5d | Director |
| T6: e2e（含 override 流程） | 0.5d | QA |

**交付**：默认自动布局，admin 可调；同桌同学可传纸条，自动接力发言。

### W5 · 黑板（Blackboard Mode）

| Task | Est | Owner |
|---|---|---|
| T1: canvas 顶部 tab 加"白板 / 幻灯片"切换 | 0.5d | FE |
| T2: `blackboard_annotate` DSL action | 0.5d | DSL |
| T3: chalk-style 渲染层（沿用 wb_draw_shape，加纹理） | 1d | renderer |
| T4: 全角色可写（用户也要能画）| 0.5d | FE |
| T5: snapshot test + e2e | 0.5d | QA |

**交付**：任何人都能在白板上写。

### 总览

| W | 模块 | 依赖 | 阻塞风险 |
|---|---|---|---|
| W1 | period_bell + bar | 无 | 低 |
| W2 | raise_hand | W1 | 中（Director 节点会动 graph） |
| W3 | call_on | W2 | 低 |
| W4 | pass_note + seatLayout | W2 | 中（admin 接入） |
| W5 | blackboard_annotate | 无 | 低 |

**关键依赖**：W2 触发 Director graph 增量改动 —— 是最风险点（W4 也风险，因 seatLayout 涉及 admin 侧 API）。

---

## 7. 失败处理

| 场景 | 处理 |
|---|---|
| 举手冲突（≥3 人同时）| Director 按 seatIndex + raiseTime 排队；最久未回答的优先 |
| 叫答时 target 已 offline | 自动降级为 cue_user + 通知 Director |
| period 超时 | Director 不阻塞，自动 emit period_end + 转下节课 scene |
| pass_note 收方不是邻桌 | action 校验拒绝 + Director 抛 warning |
| blackboard_annotate 在非白板模式 | 自动 toggle 进白板 + 警告 toast |
| 用户同时 mic + text + raise_hand | 输入优先级：text > voice > raise_hand；raise_hand 不阻塞输入 |
| 课堂状态机陷入非法态 | reducer 校验 + 自动 reset 到 `lesson` + 上报 |
| ASR 转写失败（语音举手）| 退化为 text 举手 |

---

## 8. 测试策略

### 8.1 单元测试

- `lib/dsl/action-schema-validator`：7 个新 action schema 校验
- `lib/store/classroom-reducer`：4 个 period × 6 个交互态 = 24 转移 + 边界
- 7 个新 action 的 reducer 处理函数

### 8.2 集成测试

- W1 completion：playwright 跑完整"开课→倒计时→下课→课间→再开课"
- W2：用户点击举手 + agent 主动举手 + 队列满自动 cue
- W3：call_on 触发 + 准备 + 自动 fallback
- W4：pass_note 飞纸条动画 + 收方响应
- W5：blackboard toggle + annotate

### 8.3 视觉回归

- 加 snapshot 到现有 `e2e/tests/classroom-interaction.spec.ts`
- PeriodBar 4 种状态（活跃/下课/课间/重置）snapshot
- CallOnCard 3 种触发态 snapshot

### 8.4 E2E 剧本

完整"开课→老师讲课→同学举手→老师叫同学回答→同学传纸条→用户也举手→老师点用户回答→黑板板书→下课"一节课剧本。

---

## 9. 兼容性 / 不破坏的承诺

### 9.1 不改的部分（强约束）

- `components/roundtable/index.tsx` 视觉布局 —— **不修改**
- `components/chat/chat-area.tsx` —— **不修改**
- `components/canvas/canvas-area.tsx` 已有 widget 渲染 —— **不修改**（白板是新增 layer）
- 现有 22 个 DSL action —— **不修改**（仅追加新 action）
- 现有 Director graph 节点路径 —— **不修改**（仅追加节点 + 边）
- 现有 Socratic 场景 `mockups/socratic-dialogue.html` —— **继续能跑通**

### 9.2 数据兼容

- DocumentStore 不增加必填字段（旧文档无需迁移）
- 新增字段全部可选 + 默认值
- `seatLayout` 由 admin/edit 侧写入，老场景无座位 → 默认全员为"自由席"（无 pass_note）

### 9.3 配置兼容

- DSL config `classroom.enabled` 默认 false（V1 可独立关闭）
- 关闭后表现 = 当前 Roundtable 完全不变（零副作用）

---

## 10. 风险与 mitigation

| 风险 | 概率 | 影响 | mitigation |
|---|---|---|---|
| Director graph 加 raise_hand 节点破坏现有 Socratic | 中 | 高（核心场景）| **D-1 决策**：把 raise_hand 节点抽到独立 service `ClassroomService.callRaiseHand()`，不侵入 Director graph 主路径；W2 必须跑全量 Socratic e2e 回归；feature flag `classroom.enabled` 默认 ON，可关闭立即回退 |
| seatLayout 配置老场景没座位 | 中 | 中 | **D-2 决策**：Director 启动时调用 `ClassroomLayoutService.autoGenerate(seats, agents)` — 默认"邻座 = 同桌"；admin 可在 settings page override 单个座位关系 |
| Period bar 侵入顶部让手机/iPad 拥挤 | 中 | 中 | 移动端折叠：bar 自动缩成底部 36px mini bar |
| Blackboard chalk 性能（vite 渲染）| 低 | 中 | 用 canvas API 渲染 + 限制 stroke 数 ≤ 500 |
| 举手队列 UI 抢占 ProactiveCard 焦点 | 低 | 低 | 队列气泡 z-index < ProactiveCard |
| period bell 触发时被静音 | 低 | 低 | 用 Web Audio API 而非 HTMLAudio（可绕过静音） |
| 7 个新 action 让场景 JSON 体积膨胀 | 低 | 低 | 单 action payload 上限 4KB |
| INTL homeschool 与"教室"语义冲突 | 低 | 中 | **D-3 决策**：i18n bundle 加 `classroom.cn.json` + `classroom.intl.json`；UI 文案 switch by `useI18n().t('classroom.X')`；功能 100% 复用，仅改字面。INTL V1 默认开启 Classroom，但 persona 翻译为 "homeroom teacher" / "study buddy" / "circle time" / "lesson marker" |

---

## 11. Future work · V1.1 升 B（空间模式）

C 架构为 B 演化做了哪些预留：

| C 元素 | B 演化路径 |
|---|---|
| `seatLayout` | 升级为可视化俯瞰图 + 可拖拽座位 |
| `handRaiseQueue` | 升级为头像举手 + 空间坐标 |
| `call_on` | 加 spotlight 走线 + 接近动画 |
| `pass_note` | 升级为 3D 路径飞行 |
| PeriodBar | 不变（B 阶段不需要） |
| Blackboard | 升级为整面投影墙 |
| RoundTable 中央气泡区 | B 阶段替换为俯瞰图 |

**关键预留**：所有新 state 是平铺在 `ClassroomState` 顶层，**便于直接迁移到 B 的 3D canvas**。

---

## 12. References

- Brainstorm session（2026-08-25）：OpenMAIC 「更像教室」改造 → 选定 C
- `specs/shared-architecture.md` §1（monorepo structure）
- `specs/cn-companion-mvp-plan.md`（W1-W7 主计划，C 在 W6+ 后插入或 V1.1）
- `components/roundtable/index.tsx`（现状 2141 行）
- `mockups/classroom-layout-c3.html`（已有的 C3 探索）
- `e2e/tests/classroom-interaction.spec.ts`（现有 spec 基础）

---

## 13. 审计 / 自检（用户已批准 2026-08-25）

| 项 | 状态 |
|---|---|
| Placeholder scan (TBD/TODO) | ✅ 无 |
| Internal consistency | ✅（7 个 action 互相引用一致；状态机 4×6 完整）|
| Scope check（fits in single plan）| ✅ 5 周分 W1-W5，可单独排期 |
| Ambiguity check | ✅（D-1/D-2/D-3 已决策；raise_hand vs discussionRequest 语义清晰）|

**用户拍板**：
- D-1: V1 与 CN MVP 同步（raise_hand 隔离为 ClassroomService.callRaiseHand，不侵入 Director 主路径）
- D-2: seatLayout = Director 自动生成 + admin override
- D-3: INTL V1 兼容（i18n + persona 文案翻译：homeroom teacher / circle time / morning basket）
