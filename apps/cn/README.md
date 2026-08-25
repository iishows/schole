# OpenMAIC Companion · CN (中国伴学)

**独立部署** · **Region: cn**

## 产品定位

中国双职工家庭课后作业辅导。班主任 + 2 同学（小红📍北京/小亮📍上海/阿泽📍广州）+ 家长助手。

## 独立部署

| 项 | 值 |
|---|---|
| 部署目标 | 微信小程序 + 公众号 |
| 合规 | PIPL + 未年人保护法 + 双减 |
| 数据本地化 | **cn**（强） |
| 推送 | WeChat mini-program + WeChat service account |
| 支付 | WeChat Pay + Alipay |
| 定价 | ¥99-299/月 |
| 默认语言 | zh-CN |
| 启用语言 | zh-CN, en-CN |
| 默认主题 | 💜 Lavender |

## 教材

- 人教版 4 年级数学（运营上传）
- 苏教版 4 年级语文

## 独立部署命令

```bash
# 此目录是 1 个独立部署
cd apps/cn
pnpm install
pnpm build:cn  # build target = cn
pnpm deploy:cn  # 部署到 cn.example.com
```

## Spec

完整 region 专属 spec 见 [`SPEC.md`](./SPEC.md)。

共享架构 spec 见 [`../../specs/companion.md`](../../specs/companion.md)。

## 部署配置

[`config.json`](./config.json) 含 personas / textbooks / channels / compliance / pricing / onboarding / i18n / theme 等。Operator 可在 admin 后台编辑。
