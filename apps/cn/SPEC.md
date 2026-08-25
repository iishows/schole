# OpenMAIC Companion · CN Region Spec

**Deployment**: Independent (apps/cn)
**Region**: cn
**Shared architecture spec**: [`../../specs/cn/companion.md.bak`](../../specs/cn/companion.md.bak)

---

## 1. 概述

中国双职工家庭课后作业辅导。班主任（"小诺姐姐" 等）+ 2 同学（小红📍北京/小亮📍上海/阿泽📍广州）+ 家长助手。

## 2. 独立部署

| 项 | 值 |
|---|---|
| 部署 URL | cn.example.com（微信小程序） |
| 部署基础设施 | 中国大陆服务器（阿里云 / 腾讯云） |
| 数据本地化 | **强制**（数据不出境） |
| 数据库 | 中国大陆 MySQL/PostgreSQL（阿里云 RDS） |
| 对象存储 | 阿里云 OSS（中国大陆 region） |
| CDN | 阿里云 CDN（中国大陆节点） |

## 3. 角色（per shared spec §3）

4 真人 + 5 虚拟角色，共用 shared architecture。

## 4. 业务配置

| 配置 | 值 |
|---|---|
| Persona 模板 | 5 个 mentor + 4 个 buddy + 1 个 parent_assistant（见 config.json） |
| 教材 | 人教版 4 年级数学 + 苏教版 4 年级语文（运营上传） |
| 推送渠道 | WeChat mini-program + WeChat service account |
| 合规 | PIPL + 未成年人保护法 + 双减政策 |
| 定价 | ¥99 单孩 / ¥199 家庭 ≤3孩 |
| 支付 | 微信支付 + 支付宝 |
| Onboarding | 7 步（含微信扫码绑定） |
| 默认语言 | zh-CN |
| 启用语言 | zh-CN, en-CN |
| 默认主题 | 💜 Lavender |
| 启用主题 | Lavender, Light, Dark |
| Region 独有 feature | `classroomRecording: true`, `momentsShare: true` |

## 5. 数据流

参见 shared architecture spec §3.3，添加 region-specific 步骤：

```
学生完成课程
  ↓
触发渲染任务（classroomRecording 启用）
  ↓
视频存到阿里云 OSS（中国大陆 region）
  ↓
家长推送带 "📹 课堂回放" 链接
  ↓
朋友圈 H5 分享（momentsShare 启用）
```

## 6. 工作量分阶段（CN-specific）

| Phase | 内容 | 周 |
|---|---|---|
| CN-1 | persona 模板 + onboarding + 微信小程序 | 3 周 |
| CN-2 | 课堂录制 + 朋友圈分享 | 2 周 |
| CN-3 | 朗读评测 + 情绪检测 | 2 周 |

## 7. 风险

| 风险 | 缓解 |
|---|---|
| 双减政策收紧 | 保持"AI 辅导"而非"AI 教学"定位 |
| 微信 API 变更 | 关注微信公告，半年内审计 |
| 数据出境合规 | 强制 cn 数据本地化 |

## 8. 配置位置

- 部署配置：`./config.json`（运营可编辑）
- 共享架构：`../../specs/cn/companion.md.bak`
- Mockups：`../../mockups/`
