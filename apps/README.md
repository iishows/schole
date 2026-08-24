# OpenMAIC Product Apps

OpenMAIC 主仓库承载 multi-agent 课程生成 + 渲染基础设施（`packages/`, `app/`, `lib/`）。
`apps/` 下是**产品化的子项目**，每个有独立的 spec + README + regions 配置 + 后续代码路径。

## 子项目

| 子项目 | 类型 | Spec | README | Regions |
|---|---|---|---|---|
| [`companion/`](./companion/) | 单产品 + region 配置 | [`SPEC.md`](./companion/SPEC.md) | [`README.md`](./companion/README.md) | CN / US-TX / AU-NSW / SG / EU-DE |

**关键转变（2026-08-25 refactor）**：从"两个独立产品（cn-companion + intl-companion）"重构为
"**单一产品 + region 配置**"。理由：所有地区差异（推送渠道 / 教材 / 合规 / 定价）都是
**配置**而非代码——见 [`specs/companion.md`](../specs/companion.md) §2 region config schema。

## 共享架构

所有 region 共享 OpenMAIC 主仓库底层：

```
OpenMAIC (D:/projects/openmaic/)
├── packages/@openmaic/dsl         ← DSL types (shared)
├── packages/@openmaic/storage      ← PostgreSQL + IndexedDB persistence (shared)
├── packages/@openmaic/generation   ← outline + scene generation (shared)
├── packages/@openmaic/renderer    ← rendering incl. video export (shared)
├── packages/@openmaic/importer    ← PPTX / PDF import (shared)
├── packages/@openmaic/editor      ← slide editor (shared)
├── app/                            ← Next.js app shell (region-aware via config)
├── lib/                            ← server + client libs (shared)
├── lib/companion-core/             ← companion-specific core (future)
├── mockups/                        ← UI design mockups (region-agnostic + per-region)
├── specs/                          ← canonical spec (single source)
│   └── companion.md                ← single product spec (region-driven)
└── apps/
    └── companion/                   ← single product sub-project
        ├── README.md
        ├── SPEC.md                   ← copy of canonical spec
        └── regions/
            ├── cn/config.json
            ├── us-tx/config.json
            ├── au-nsw/config.json
            ├── sg/config.json
            └── eu-de/config.json
```

**Feature flag**（v1）：
```bash
NEXT_PUBLIC_COMPANION=true pnpm dev   # enabled; region picked at runtime
```

**Spec 一致性原则**：
- `specs/companion.md` 是**唯一事实源**
- `apps/companion/SPEC.md` 是同步拷贝（子项目拥有）
- Spec 修订先改 `specs/`，再 sync 到 `apps/companion/SPEC.md`

## 当前状态

| 子项目 | Spec | Regions | Mockups | 代码 |
|---|---|---|---|---|
| **companion** | ✅ | ✅ 5 个示例 | ✅ 12 个 | ❌ 待启动 |

## Mockups（12 个）

**Universal / region-agnostic**（4 个）：
- `classroom-layout-c3.html` — 教室 C3（定版）
- `student-home.html` — 学生开始页
- `admin-console.html` — 管理后台
- `region-picker.html` — 首次访问 region 选择（NEW）

**Operator**（2 个）：
- `admin-region-config.html` — operator 配置 region（NEW）
- (admin-console.html 也覆盖)

**Region-flavored**（6 个，按 channel 区分）：
- `wechat-push.html` — 微信小程序推送（CN）
- `whatsapp-push.html` — WhatsApp Business 推送（INTL）
- `home-school-classroom.html` — INTL 教室（Ms. Maple 暖木）
- `home-school-parent-dashboard.html` — INTL 家长 dashboard
- `home-school-onboarding.html` — INTL onboarding
- `cn-parent-recording.html` — CN 课堂录制嵌入
- `cn-wechat-moments-share.html` — CN 朋友圈 H5

## 下一步

按 `specs/companion.md`：
1. Phase 1 MVP（CN + US-TX 并行，4 周，2-3 人）
2. Phase 2 增加 AU / SG / EU-DE（4 周）
3. Phase 3 高级功能（录制 / 语音评测 / MAP Test Prep，4 周）

调用 `writing-plans` skill 拆任务后启动实施。
