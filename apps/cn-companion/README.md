# OpenMAIC Companion · CN (中国版课后伴学)

**产品代号**: cn-companion
**目标市场**: 中国大陆
**目标用户**: 4-6 年级小学生 + 双职工家庭
**定价**: ¥99-299/月
**法规**: PIPL + 未成年人保护法 + 微信小程序 + 双减政策

## 定位

AI 班主任 + AI 同伴陪伴课后作业。家长微信小程序接收每日报告。
解决"老师上完课学生不会 + 家长不会辅导"的核心痛点。

## Spec

完整设计 spec 见 [`SPEC.md`](./SPEC.md)（copy of `specs/2026-08-25-companion-cn.md`）。

## 共享架构

依赖 OpenMAIC 主仓库底层：
- `packages/@openmaic/dsl` — DSL types
- `packages/@openmaic/storage` — IndexedDB + PostgreSQL persistence
- `packages/@openmaic/generation` — outline + scene 生成
- `packages/@openmaic/renderer` — 渲染（含 video export）

## 差异化（中国独有）

| 维度 | 实现 |
|---|---|
| 角色命名 | 班主任 + 2 同学（小红📍北京 / 小亮📍上海） |
| 学习节奏 | 25min 番茄钟 |
| 教材 | 人教版 / 苏教版 / 北师大版 |
| 家长面板 | 微信小程序 + 长期订阅消息 |
| 推送 | 微信公众号 + 模板消息 |
| 教室 UI | 紫 (#722ed1) + 黑板 |
| 课堂录制 | HLS 嵌入 + 朋友圈 H5 分享（v1.5） |

## Mockups

- `mockups/classroom-layout-c3.html` — 教室定版
- `mockups/student-home.html` — 学生开始页
- `mockups/admin-console.html` — 管理后台
- `mockups/wechat-push.html` — 微信小程序推送
- `mockups/cn-parent-recording.html` — 课堂回放嵌入
- `mockups/cn-wechat-moments-share.html` — 朋友圈分享 H5

## 路径

- Spec: `apps/cn-companion/SPEC.md`
- 后续代码: `apps/cn-companion/src/`（待创建）
- 复用 OpenMAIC 底层包

## 启动

```bash
# 主仓库
pnpm install
pnpm dev  # 在 http://localhost:3000

# CN 特有功能在 features 开关下：
# NEXT_PUBLIC_COMPANION_CN=true
```
