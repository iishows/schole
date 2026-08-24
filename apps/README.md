# OpenMAIC Product Apps

OpenMAIC 主仓库承载 multi-agent 课程生成 + 渲染基础设施（`packages/`, `app/`, `lib/`）。
`apps/` 下是**产品化的子项目**，每个有独立的 spec + README + 后续代码路径。

## 子项目

| 子项目 | 市场 | Spec | README |
|---|---|---|---|
| [`cn-companion/`](./cn-companion/) | 中国大陆 | [`SPEC.md`](./cn-companion/SPEC.md) | [`README.md`](./cn-companion/README.md) |
| [`intl-companion/`](./intl-companion/) | 美/澳/东南亚 home school | [`SPEC.md`](./intl-companion/SPEC.md) | [`README.md`](./intl-companion/README.md) |

## 共享架构

两个子项目**共用** OpenMAIC 主仓库底层：

```
OpenMAIC (D:/projects/openmaic/)
├── packages/@openmaic/dsl         ← DSL types (shared)
├── packages/@openmaic/storage      ← PostgreSQL + IndexedDB persistence (shared)
├── packages/@openmaic/generation   ← outline + scene generation (shared)
├── packages/@openmaic/renderer    ← rendering incl. video export (shared)
├── packages/@openmaic/importer    ← PPTX / PDF import (shared)
├── packages/@openmaic/editor      ← slide editor (shared)
├── app/                            ← Next.js app shell (feature-flagged)
├── lib/                            ← server + client libs (shared)
├── mockups/                        ← UI design mockups
├── specs/                          ← canonical specs (single source)
└── apps/
    ├── cn-companion/               ← 中国伴学产品
    └── intl-companion/             ← 国际 home school 产品
```

**差异化策略**（feature flag）：
- `NEXT_PUBLIC_COMPANION_CN=true` 启用中国 UI + 微信集成
- `NEXT_PUBLIC_COMPANION_INTL=true` 启用国际 UI + Email/WhatsApp

**Spec 一致性**：所有 `apps/<name>/SPEC.md` 都是 `specs/` 的拷贝（避免多份事实）。Spec 修订在 `specs/`，然后同步拷贝到对应子项目。

## 当前状态

| 子项目 | Spec | Mockups | 代码 |
|---|---|---|---|
| cn-companion | ✅ | ✅ 6 个 | ❌ 待启动 |
| intl-companion | ✅ | ✅ 4 个 | ❌ 待启动 |

## 下一步

按 `specs/2026-08-25-companion-{cn,intl}.md`：
1. Phase 1 MVP（中国 3-4 周 / 国际 4 周）
2. Phase 2 集成（微信 / Email-WhatsApp）
3. Phase 2.5（中国课堂录制） / Phase 3（完整版）

调用 `writing-plans` skill 拆任务后启动实施。
