# OpenMAIC Apps · 2 Products

OpenMAIC 主仓库承载 multi-agent 课程生成 + 渲染基础设施（`packages/`, `app/`, `lib/`）。
`apps/` 下是 **2 个产品独立部署**——每个产品 1 个独立子项目，物理隔离。

## 部署模型（重构于 2026-08-25）

每个产品 = **1 个独立部署**：

- **独立代码路径**（monorepo 内 `apps/<product>/`）
- **独立基础设施**（CN 在阿里云 / INTL 在 AWS）
- **独立合规**（CN: PIPL + 双减 / INTL: COPPA + FERPA + GDPR-K + State Law）
- **独立团队**（CN 团队 / INTL 团队）
- **独立品牌**（小诺学伴 / MapleClass）

**共享**：底层包（`packages/@openmaic/*`）+ 共享架构 spec（`specs/shared/shared-architecture.md`）。

## 2 个产品独立子项目

| Product | 部署目标 | 合规 | 数据本地化 | 默认语言 | 默认主题 |
|---|---|---|---|---|---|
| [`cn/`](./cn/) | 微信小程序 + 公众号 | PIPL + 未成年 + 双减 | **cn 强制** | zh-CN | 💜 Lavender |
| [`intl/`](./intl/) | Web PWA + Email + WhatsApp | COPPA + FERPA + GDPR-K | us (default) | en-US | 🌳 Warm-wood |

每个子项目结构：
```
apps/<product>/
├── README.md       ← 产品定位 + 部署信息
├── SPEC.md         ← 产品专属 spec（指向 specs/<product>-product.md）
└── config.json     ← personas / textbooks / channels / pricing
```

## 添加新产品的流程

1. **复制模板**：`cp -R apps/intl/ apps/eu-fr/`（找最近的产品模板）
2. **改 config.json**：personas / textbooks / channels / compliance / pricing / i18n / theme
3. **改 README + SPEC**：产品定位 + 部署 + 合规
4. **部署到产品所在区域的云**：AWS / 阿里云 / 腾讯云
5. **CI/CD**：每个产品独立 pipeline

## 共享架构

**所有产品共用**：
- `packages/@openmaic/dsl` — Action 协议（22 种）+ Stage/Scene 类型
- `packages/@openmaic/storage` — DocumentStore + AssetStore + RuntimeStore
- `packages/@openmaic/generation` — outline + scene 生成
- `packages/@openmaic/renderer` — slide / quiz / widget 渲染
- `packages/@openmaic/importer` — PPTX / PDF 导入
- `packages/@openmaic/editor` — slide editor
- `lib/` — server + client libs
- `lib/companion-core/` — companion-specific core
- `specs/shared/shared-architecture.md` — **共享架构 spec**（multi-agent / DSL / 4 共性痛点 / 4 核心功能）
- `mockups/shared/` — 通用 mockup（错题本 / 周报 / 知识图谱）

**Product-specific**（每个产品独立）：
- 部署 URL
- 推送渠道（WeChat / Email / WhatsApp）
- 支付（微信支付 / Stripe / PayPal）
- 合规（PIPL / COPPA / GDPR-K）
- Persona 模板（班主任/同学人设）
- 定价 + 货币
- 默认主题 + 默认语言
- 产品专属功能（CN 课堂回放 / INTL Portfolio）

## Specs（3 个文件）

| 文件 | 内容 |
|---|---|
| [`specs/shared/shared-architecture.md`](../specs/shared/shared-architecture.md) | 共享架构（2 产品 + 4 共性痛点 + 4 核心功能 + DSL + Director + 5 主题 + 12 语种） |
| [`specs/cn/cn-product.md`](../specs/cn/cn-product.md) | CN 产品 spec（虚拟晚托班 + 班主任小诺姐姐 + 微信 + PIPL + 双减） |
| [`specs/intl/intl-product.md`](../specs/intl/intl-product.md) | INTL 产品 spec（Charlotte Mason 私塾 + Ms. Maple + Email + COPPA + GDPR-K） |
| [`specs/cn/companion.md.bak`](../specs/cn/companion.md.bak) | 历史（2026-08-25 之前的 5-region 方案，已废弃） |

## 状态

| Product | Spec | Config | Mockups | 代码 |
|---|---|---|---|---|
| cn | ✅ | ✅ | 🟡 mockups/cn/ 待补 | ❌ 待启动 |
| intl | ✅ | 🟡 待从 apps/cn/config.json 改造 | 🟡 mockups/intl/ 待补 | ❌ 待启动 |

## 下一步

按 `specs/shared/shared-architecture.md`（共享架构）+ 每个产品的 `SPEC.md`（专属 spec）：
1. 每个产品独立 Phase 1 MVP（CN 3-4 周 / INTL 4 周）
2. 每个产品独立 CI/CD
3. 共享包更新通过 monorepo workspace

调用 `writing-plans` skill 拆每个产品的实施任务。
