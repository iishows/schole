# OpenMAIC Product Apps — Region-Deployed

OpenMAIC 主仓库承载 multi-agent 课程生成 + 渲染基础设施（`packages/`, `app/`, `lib/`）。
`apps/` 下是 **5 个 region 独立部署**——每个 region 1 个独立子项目，物理隔离。

## 部署模型（重构于 2026-08-25）

每个 region = **1 个独立部署**：
- 独立代码库（即使在 monorepo 内）
- 独立基础设施（CN 在阿里云 / US 在 AWS us-east-1 / EU 在 AWS eu-central-1）
- 独立合规（数据本地化强制 / GDPR-K / PIPL / COPPA+FERPA）
- 独立团队（CN 团队 / US 团队 / EU 团队）

**共享**：底层包（`packages/@openmaic/*`）+ 共享架构 spec（`specs/companion.md`）。

## 5 个 region 独立子项目

| Region | 部署目标 | 合规 | 数据本地化 | Mockups |
|---|---|---|---|---|
| [`cn/`](./cn/) | 微信小程序 + 公众号 | PIPL + 未年人保护法 | **cn 强制** | [`cn-*.html`](../mockups/) |
| [`us/`](./us/) | Web + Email + WhatsApp | COPPA + FERPA + TX §25.086 | us (default) | [`home-school-*.html`](../mockups/) + [`whatsapp-push.html`](../mockups/) |
| [`au-nsw/`](./au-nsw/) | Web + Email + WhatsApp | Privacy Act 1988 | au (preferred) | (clone from US) |
| [`sg/`](./sg/) | Web + Email + WhatsApp | PDPA 2012 | sg (preferred) | (clone from US, bilingual EN/ZH) |
| [`eu-de/`](./eu-de/) | Web + Email | GDPR-K (DSGVO) | **EU 强制** | (clone from US, GDPR-K + WCAG) |

每个子项目结构：
```
apps/<region>/
├── README.md       ← 产品定位 + 部署信息
├── SPEC.md         ← region 专属 spec（合规 / 工作量 / 风险）
└── config.json     ← personas / textbooks / channels / pricing
```

## 添加新 region 的流程

1. **复制模板子项目**：`cp -R apps/us/ apps/eu-fr/`（找最近的 region 模板）
2. **改 config.json**：region code / displayName / personas / textbooks / compliance / pricing / i18n / theme
3. **改 README + SPEC**：region-specific 合规 / 工作量 / 风险
4. **部署到 region 的云**：AWS / 阿里云 / 腾讯云 per region
5. **CI/CD**：每个 region 独立 pipeline

## 共享架构

**所有 region 共用**：
- `packages/@openmaic/dsl` — DSL types
- `packages/@openmaic/storage` — PostgreSQL + IndexedDB persistence
- `packages/@openmaic/generation` — outline + scene generation
- `packages/@openmaic/renderer` — rendering incl. video export
- `packages/@openmaic/importer` — PPTX / PDF import
- `packages/@openmaic/editor` — slide editor
- `app/` — Next.js app shell (per-region build target)
- `lib/` — server + client libs
- `lib/companion-core/` — companion-specific core
- `specs/companion.md` — **共享架构 spec**（multi-agent / director / RBAC / 抽象接口）
- `mockups/` — UI 设计稿

**Region-specific**（每个 region 独立）：
- 部署 URL
- 推送渠道（WeChat / Email / WhatsApp / SMS）
- 支付（微信支付 / Stripe / PayPal）
- 合规（PIPL / COPPA+FERPA / PDPA / GDPR-K）
- 教材（人教版 / Common Core / Singapore Math / KMK / Australian Curriculum）
- 角色名 + 头像 + 城市（班主任 vs mentor / 同学 vs buddy）
- 定价 + 货币

## Mockups（14 个）

Universal / region-agnostic：
- `classroom-layout-c3.html` — 教室 C3
- `student-home.html` — 学生开始页
- `admin-console.html` — 管理后台
- `region-picker.html` — Region 选择（架构 demo）
- `admin-region-config.html` — Admin Region 配置（架构 demo）
- `admin-i18n-theme-editor.html` — Admin i18n + 主题编辑

Region-flavored：
- `wechat-push.html` — 微信小程序推送（CN）
- `whatsapp-push.html` — WhatsApp 推送（INTL）
- `cn-parent-recording.html` — 课堂回放（CN 独有）
- `cn-wechat-moments-share.html` — 朋友圈 H5（CN 独有）
- `home-school-classroom.html` — 国际学生教室（US/AU/SG 风格）
- `home-school-parent-dashboard.html` — 国际家长 dashboard
- `home-school-onboarding.html` — 国际 onboarding

**demo 站点**：`mockups/index.html`（多语言 + 多主题切换）

## 状态

| Region | Spec | Config | Mockups | 代码 |
|---|---|---|---|---|
| cn | ✅ | ✅ | ✅ | ❌ 待启动 |
| us | ✅ | ✅ | ✅ | ❌ 待启动 |
| au-nsw | ✅ | ✅ | ✅（克隆自 US） | ❌ 待启动 |
| sg | ✅ | ✅ | ✅（克隆自 US） | ❌ 待启动 |
| eu-de | ✅ | ✅ | ✅（克隆自 US + GDPR） | ❌ 待启动 |

## 下一步

按 `specs/companion.md`（共享架构 spec）+ 每个 region 的 `SPEC.md`（专属 spec）：
1. 每个 region 独立 Phase 1 MVP（CN 3-4 周 / US 4 周 / AU/SG/EU 各自 ~2 周启动）
2. 每个 region 独立 CI/CD
3. 共享包更新通过 monorepo workspace

调用 `writing-plans` skill 拆每个 region 的实施任务。
