# OpenMAIC · Shared Architecture (CN + INTL)

**Date**: 2026-08-25
**Status**: Draft · Pending review
**Architecture**: 2 products (CN + INTL) sharing monorepo core lib

> 2 products share packages/@openmaic/* (DSL / storage / generation / renderer / agent / editor / importer). Each product ships its own runtime, deployment, compliance boundary, team, and brand.

---

## 1. Architecture Overview

### 1.1 Two Products

| Product | Region | Market | Brand | Deployment |
|---|---|---|---|---|
| CN | cn | 中国 K12 双职工家庭 | 小诺学伴（暂定） | 阿里云 cn-region |
| INTL | global | 美/澳/新/欧 homeschool | MapleClass（暂定） | AWS us-east-1 |

**Why 2 products (not 1)**:
- **法律硬约束**：CN 数据本地化（PIPL）禁止部署在 AWS；INTL 用 Email/Stripe 不能用微信
- **渠道硬约束**：CN 微信生态 vs INTL Email+Stripe 是两个独立体系
- **运营独立**：CN 双减 vs INTL state law 需要不同团队跟踪
- **成本可控**：通过共享 lib，开发成本 ≈ 1.3x（不是 2x）

### 1.2 monorepo Structure

```
D:/projects/openmaic/
├── packages/@openmaic/             ← 共享 lib（CN + INTL 都用）
│   ├── dsl/                        ← Action 协议 + Stage/Scene 类型
│   ├── storage/                    ← DocumentStore / AssetStore / RuntimeStore
│   ├── generation/                 ← outline + scene 生成
│   ├── renderer/                   ← slide / quiz / widget 渲染
│   ├── importer/                   ← PPTX / PDF 导入
│   └── editor/                     ← slide editor
├── apps/
│   ├── cn/                         ← CN runtime（独立部署：阿里云）
│   │   ├── README.md
│   │   ├── SPEC.md                 ← → specs/cn/cn-product.md
│   │   └── src/                    ← CN 业务代码（微信/支付宝/PIPL guard）
│   └── intl/                       ← INTL runtime（独立部署：AWS）
│       ├── README.md
│       ├── SPEC.md                 ← → specs/intl/intl-product.md
│       └── src/                    ← INTL 业务代码（Email/WhatsApp/Stripe）
├── specs/
│   ├── shared-architecture.md      ← 本文件
│   ├── cn-product.md               ← CN 业务 spec
│   ├── intl-product.md             ← INTL 业务 spec
│   └── companion.md.bak            ← 历史（2026-08-25 之前的 5-region 方案）
└── mockups/
    ├── cn/                         ← CN 专属 mockup（虚拟晚托班）
    ├── intl/                       ← INTL 专属 mockup（私塾）
    └── shared/                     ← 通用 mockup（错题本 / 周报 / 知识图谱等）
```

### 1.3 Shared Packages

| Package | 提供 | 谁用 |
|---|---|---|
| `@openmaic/dsl` | Action 协议（22 种）+ Stage/Scene 类型 + 验证器 | CN + INTL |
| `@openmaic/storage` | DocumentStore 接口 + Browser + Postgres 实现 | CN + INTL |
| `@openmaic/generation` | outline + scene generator + prompt 模板 | CN + INTL |
| `@openmaic/renderer` | slide / quiz / widget / interactive 渲染 | CN + INTL |
| `@openmaic/importer` | PPTX / PDF 导入 + 章节提取 | CN + INTL |
| `@openmaic/editor` | slide editor（运行时可关） | CN + INTL |

**共享边界**：协议、类型、纯函数、可插拔 adapter。

**不共享**：业务逻辑（compliance guard / channel adapter / pricing / persona template）。

---

## 2. Universal Pain Points (CN + INTL)

两个市场的家长/孩子**共有的 4 大痛点**——这是产品存在的根本理由。

| 痛点 | 强度 | 真实场景 |
|---|---|---|
| **缺专业辅导者** | 🔴🔴🔴 | 家长不会讲；学校老师 1 个对 40 个孩子 |
| **缺同伴** | 🔴🔴🔴 | CN 周末一个人写作业；INTL homeschool 缺社交 |
| **看不到掌握度** | 🔴🔴🔴 | CN 月考才知道；INTL portfolio 整理才知道 |
| **错题没人讲** | 🔴🔴🔴 | 错题本抄完没人讲，下次还错 |

### 痛点 × 价值映射

| 痛点 | 解决后家长付费理由 |
|---|---|
| 缺专业辅导者 | 替代 80-100 元/h 线下辅导（CN）/ $50-150/h co-op（INTL） |
| 缺同伴 | 让孩子主动想（peer teaching 效果最好） |
| 看不到掌握度 | 30 秒掌握孩子状态 |
| 错题没人讲 | 错题真正消化，不积灰 |

---

## 3. Core Features (shared between CN + INTL)

4 个核心功能直接对应 4 大共性痛点。

### 3.1 AI Mentor（24/7 Socratic Guide）→ 解「缺专业辅导者」

**角色**：1 个 mentor（班主任/Mentor）
**能力**：
- Socratic 引导：永远不直接给答案，先问"你怎么想"
- 错题讲解：错题入库后自动安排复盘
- 永远在线：24/7，问题不过夜
- 家长 hint 模式：家长自己不会的题，看"如何辅导孩子"

**CN 形态**：小诺姐姐风格——温柔、耐心、生活比喻（盒子里装鸡蛋 / 切披萨）
**INTL 形态**：Ms. Maple 风格——Charlotte Mason spirit、narration 优先

### 3.2 2 AI Study Buddies（Peer Learning）→ 解「缺同伴」

**角色**：2 个 buddy
**能力**：
- 主动提问：buddy 故意问"为什么"，逼孩子想清楚
- 故意犯错：模拟同伴常见错误（peer teaching 效果最好）
- 配合讨论：和 mentor 形成三角对话

**关键设计**：buddy 不是陪聊工具，是**学习脚手架**——故意制造认知冲突让孩子反思。

### 3.3 Knowledge Graph + Parent Digest → 解「看不到掌握度」

**家长视角**（3 张卡片，30 秒看懂）：
- 卡片 1：本周掌握度（数学 78% / 语文 92%）
- 卡片 2：本周错题 TOP 3（异分母加减）
- 卡片 3：本周建议（重点复习 4-NF-A-2）

**孩子视角**（详细）：
- 知识图谱：每个章节掌握度热力图
- 错题本：所有错题按章节归类
- mentor 报告：每次课表现

**CN 推送**：微信小程序 + 公众号模板消息（每日错题 / 每周周报）
**INTL 推送**：Email digest（每周日 7pm）

### 3.4 Mistake Book + Spaced Repetition → 解「错题没人讲」

**错题生命周期**：
1. 自动入库（拍照 OCR / 手动输入）
2. mentor Socratic 讲解（不直接给答案）
3. buddy 故意犯同样错（"原来我也错"）
4. 间隔重复（艾宾浩斯 1/3/7/14 天）
5. 掌握后归档

**家长视角**：错题本是"学习档案"
**孩子视角**：错题本是"升级任务"

---

## 4. DSL Action Contract

`packages/@openmaic/dsl/src/action.ts` 定义 22 种 action。

### Fire-and-forget（视觉特效）
- `spotlight` — focus on single element, dim others
- `laser` — pointer laser

### Synchronous（必须等待完成）
- `speech` — TTS 播放（mentor/buddy 说话）
- `play_video` — 视频播放
- `wb_open / wb_close` — 白板开关
- `wb_draw_text / shape / chart / latex / table / line / code` — 白板绘制
- `wb_edit_code` — 编辑白板代码
- `wb_clear / wb_delete` — 白板清除
- `discussion` — 多 agent 讨论
- `widget_highlight / setState / annotation / reveal` — 交互组件

### Action 总数
```
ACTION_TYPES = [
  'spotlight', 'laser', 'play_video', 'speech',
  'wb_open', 'wb_close',
  'wb_draw_text', 'wb_draw_shape', 'wb_draw_chart', 'wb_draw_latex',
  'wb_draw_table', 'wb_draw_line', 'wb_draw_code', 'wb_edit_code',
  'wb_clear', 'wb_delete',
  'discussion',
  'widget_highlight', 'widget_setState', 'widget_annotation', 'widget_reveal'
]  // 22 个
```

CN + INTL 共用——mentor 和 buddy 通过这 22 个 action 驱动课件。

---

## 5. Multi-Agent Director Graph

`lib/orchestration/director-graph.ts` + `lib/agent/runtime/build-agent.ts`

### 5.1 架构

```
START → director ──(end)──→ END
           │
           └─(next)→ agent_generate ──→ END
```

基于 LangGraph StateGraph：
- 单 agent：纯代码逻辑（无 LLM）
- 多 agent：LLM-based 决策 + turn 0 fast-path

### 5.2 Pi Agent Runtime

每个 agent 是一个 pi `Agent`：
- 注入 `StreamFn` → OpenMAIC connector
- `beforeToolCall` allowlist gate（tool 白名单）
- `afterToolCall` quota hook
- 多轮 memory（per-student 隔离）

### 5.3 5+ Agent Profile

每个学生可有 5+ 个 agent（1 mentor + 2 buddies + 2+ extra）：
- Operator 模板化（per-product persona template）
- Parent tweak（修改 name/persona）
- 持久化到 `agent_registry` 表

### 5.4 隔离

**per-student memory 隔离**——每个 agent 只知道 THIS student。
- COPPA / PIPL / GDPR-K + safety 要求
- 通过 `studentId` scoping 实现

---

## 6. Theme System (5 Themes)

`lib/hooks/use-theme.tsx`（当前仅 light/dark/system，需扩展到 5 主题）

### 6.1 5 主题

| Theme | Primary | Background | 适用 |
|---|---|---|---|
| 💜 **Lavender** | `#722ed1` | `#faf9fe` | CN（默认） |
| 🌳 **Warm-wood** | `#b8763e` | `#fdf9f3` | INTL Charlotte Mason |
| 🌊 **Ocean** | `#0e7490` | `#f0f9ff` | EU（高对比度 WCAG 2.1 AA） |
| ☀️ **Light** | `#2563eb` | `#ffffff` | 通用 |
| 🌙 **Dark** | `#a78bfa` | `#0f172a` | 通用 |

### 6.2 实现

CSS variables + `data-theme` attribute：
```css
[data-theme="lavender"] {
  --color-primary: #722ed1;
  --color-background: #faf9fe;
  --color-surface: #ffffff;
  /* ... */
}
```

用户偏好持久化到 localStorage + per-product 默认值。

### 6.3 高对比度

Ocean 主题满足 WCAG 2.1 AA（欧盟合规要求）。

---

## 7. i18n (12 Locales)

`lib/i18n/locales/` 已实现 12 语种。

### 7.1 支持语种

| Code | Native Name | Short |
|---|---|---|
| zh-CN | 简体中文 | CN |
| zh-TW | 繁體中文 | TW |
| en-US | English | EN |
| ja-JP | 日本語 | JA |
| ko-KR | 한국어 | KO |
| ar-SA | العربية | AR |
| pt-BR | Português (Brasil) | BR |
| es-MX | Español (México) | ES |
| fr-FR | Français | FR |
| vi-VN | Tiếng Việt | VI |
| de-DE | Deutsch | DE |
| ru-RU | Русский | RU |

### 7.2 Per-Product 默认

- CN 产品默认 zh-CN
- INTL 产品默认 en-US，可切换任意语种

### 7.3 翻译完整性

CN + INTL 必须支持 12 语种 UI 字符串。Operator 在 admin console 维护。

---

## 8. Cross-Product Principles

### 8.1 代码共享 / 数据隔离

| 项 | 共享 | 隔离 |
|---|---|---|
| DSL action 协议 | ✅ | — |
| Storage 接口 | ✅ | — |
| Agent runtime | ✅ | — |
| Theme CSS | ✅ | — |
| i18n bundle | ✅ | — |
| **运行时**（部署/DB/合规） | — | ✅ CN / INTL 独立 |
| **业务逻辑**（guard/channel/pricing/persona） | — | ✅ CN / INTL 独立 |
| **用户数据** | — | ✅ 物理隔离 |

### 8.2 团队独立 / 部署独立

| 项 | CN | INTL |
|---|---|---|
| 团队 | CN 团队 | INTL 团队 |
| 部署 URL | cn.example.com | intl.example.com |
| 云 | 阿里云 cn-region | AWS us-east-1 |
| 数据库 | 阿里云 RDS PostgreSQL | AWS RDS PostgreSQL |
| CI/CD | 阿里云流水线 | GitHub Actions |

### 8.3 品牌独立 / 渠道独立

| 项 | CN | INTL |
|---|---|---|
| 品牌 | 小诺学伴 | MapleClass |
| 推送 | 微信小程序 + 公众号 | Email + WhatsApp |
| 支付 | 微信支付 + 支付宝 | Stripe + PayPal |
| 营销 | 公众号 / 抖音 / 小红书 | SEO / Reddit / YouTube |

---

## 9. What This Spec Does NOT Cover

每个产品**独有**的部分（在各自 spec 中）：

- 业务定位（CN 虚拟晚托班 / INTL Charlotte Mason 私塾）
- 用户画像细节
- 痛点（除 4 共性外的各自专属痛点）
- 4 核心功能的**产品形态**（mentor 人设 / buddy 提问风格 / 周报卡片内容）
- 产品专属功能（CN 课堂回放 / INTL Portfolio）
- 部署架构 + 合规 + 定价 + MVP 阶段

详见：
- [cn-product.md](./cn-product.md)
- [intl-product.md](./intl-product.md)

---

## 10. Cross-Product Engine Features (Layer Roadmap)

引擎层 / 跨产品的功能层（不属于 §3 Core Features，也不属于 §9 product-only spec，而是横切层）：

| 功能层 | Spec | 影响范围 | 状态 |
|---|---|---|---|
| 教室感改造 C · Interactive Classroom Shell | [`classroom-mode-design.md`](./classroom-mode-design.md) | CN + INTL 都用（DSL 增量 + RoundTable 外壳 + 状态机） | Brainstormed · Pending review · 5 周 W1-W5 |

`classroom-mode-c3.html`（mockups/）是早期视觉探索；`classroom-mode-design.md` 是落到 DSL / 状态机 / 状态机的正式 spec。
