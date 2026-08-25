# OpenMAIC · INTL 产品（Charlotte Mason 私塾）

**品牌**：MapleClass（暂定）
**Region**：global（美/澳/新/欧 homeschool 家庭）
**部署**：AWS us-east-1（global 边缘）

---

## 产品定位

国际 homeschool 家庭 AI 私塾。AI Mentor「Ms. Maple」+ 2 Study Buddies（Emma📍Brooklyn / Noah📍San Diego / Mia📍Portland / Theo📍Seattle）+ Parent Assistant。

**一句话**：AI mentor + study buddies 按周做 homeschool，每天 45 分钟。家长从 24/7 教师退到周计划 + 情感支持。

---

## 部署目标

| 项 | 值 |
|---|---|
| 部署目标 | Web PWA + Email + WhatsApp |
| 云 | AWS us-east-1（global 边缘 CloudFront） |
| 数据库 | AWS RDS PostgreSQL（多 AZ） |
| 对象存储 | AWS S3（us-east-1） |
| CDN | AWS CloudFront（global edge） |

## 业务配置

| 项 | 值 |
|---|---|
| Persona 模板 | 5 个 mentor + 4 个 buddy + 1 个 parent_assistant |
| 教材 | Common Core Grade 4 + ELA（运营上传） |
| 推送渠道 | Email (Resend) + WhatsApp Business |
| 合规 | COPPA + FERPA + GDPR-K + State Law |
| 定价 | $14.99 solo / $24.99 family ≤3 kids |
| 支付 | Stripe + PayPal |
| 默认语言 | en-US |
| 默认主题 | 🌳 Warm-wood（Charlotte Mason aesthetic） |

## 数据流

```
Student finishes lesson
  ↓
Mistake book auto-update (拍照 OCR / 手写)
  ↓
Mentor Socratic explanation
  ↓
Spaced repetition schedule
  ↓
Email digest sent Sunday 7pm local time
  ↓
Parent reviews in Web dashboard
```

## 工作量分阶段（INTL-specific）

| Phase | 内容 | 周 |
|---|---|---|
| INTL-1 | Ms. Maple + 2 buddies + Web PWA + Stripe | 4 周 |
| INTL-2 | Email digest + WhatsApp + Portfolio auto-builder | 3 周 |
| INTL-3 | State law tracker + MAP/Iowa 备考包 | 3 周 |

## Spec

- 完整 INTL 产品 spec：[`../../specs/intl/intl-product.md`](../../specs/intl/intl-product.md)
- 共享架构 spec：[`../../specs/shared/shared-architecture.md`](../../specs/shared/shared-architecture.md)

## 部署配置

[`config.json`](./config.json) 含 personas / textbooks / channels / compliance / pricing / i18n / theme 等。
