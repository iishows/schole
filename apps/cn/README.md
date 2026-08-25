# OpenMAIC · CN 产品（虚拟晚托班）

**品牌**：小诺学伴（暂定）
**Region**：cn
**部署**：阿里云 cn-region（数据本地化强制）

---

## 产品定位

中国双职工 K12 家庭课后作业辅导。AI 班主任「小诺姐姐」+ 2 AI 同学（小红📍北京/小亮📍上海/阿泽📍广州/小美📍成都）+ 家长助手「小助理」。

**一句话**：孩子放学后，AI 班主任 + 2 AI 同学陪写作业、陪复习。家长再也不用 7-9 点陪写作业吼叫。

---

## 部署目标

| 项 | 值 |
|---|---|
| 部署目标 | 微信小程序 + 公众号 |
| 云 | 阿里云 cn-region（**强制数据本地化**） |
| 数据库 | 阿里云 RDS PostgreSQL |
| 对象存储 | 阿里云 OSS（中国大陆 region） |
| CDN | 阿里云 CDN（中国大陆节点） |

## 业务配置

| 项 | 值 |
|---|---|
| Persona 模板 | 5 个 mentor + 4 个 buddy + 1 个 parent_assistant |
| 教材 | 人教版 4 年级数学 + 苏教版 4 年级语文（运营上传） |
| 推送渠道 | WeChat mini-program + WeChat service account |
| 合规 | PIPL + 未成年人保护法 + 双减政策 |
| 定价 | ¥99 单孩 / ¥199 家庭 ≤3孩 |
| 支付 | 微信支付 + 支付宝 |
| 默认语言 | zh-CN |
| 默认主题 | 💜 Lavender |

## 数据流

```
学生完成课程
  ↓
触发错题入库（拍照 OCR）
  ↓
班主任 Socratic 讲解
  ↓
错题入库 + 间隔重复
  ↓
公众号推送家长周报（每周日 19:00）
  ↓
家长微信小程序查看详情
```

## 工作量分阶段（CN-specific）

| Phase | 内容 | 周 |
|---|---|---|
| CN-1 | 班主任「小诺姐姐」+ 2 同学 + 微信小程序 + 微信支付 | 4 周 |
| CN-2 | 课堂回放 + 朋友圈分享 | 2 周 |
| CN-3 | 朗读评测 + 情绪检测 | 2 周 |

## Spec

- 完整 CN 产品 spec：[`../../specs/cn/cn-product.md`](../../specs/cn/cn-product.md)
- 共享架构 spec：[`../../specs/shared/shared-architecture.md`](../../specs/shared/shared-architecture.md)

## 部署配置

[`config.json`](./config.json) 含 personas / textbooks / channels / compliance / pricing / i18n / theme 等。
