# OpenMAIC · INTL 产品（Charlotte Mason 私塾）

**产品名**：MapleClass（暂定）
**目标市场**：美/澳/新/欧 homeschool 家庭（K-6，5-12 岁）
**部署**：AWS us-east-1（global 边缘）
**共享架构**：[shared-architecture.md](./shared-architecture.md)

---

## 1. 产品定位

**一句话**：AI mentor + study buddies 按周做 homeschool，每天 45 分钟。家长从 24/7 教师退到周计划 + 情感支持。

**替代场景**：替代 $50-150/h 的 homeschool co-op 课 + portfolio 整理时间。

**目标家长**：homeschool 妈妈 80%（自己当老师）+ 爸爸 20%，5-12 岁孩子，家庭年收入 $50k-150k USD。

---

## 2. 用户画像

### 2.1 家长侧

- **年龄**：30-45 岁
- **角色**：自己是孩子的老师
- **痛点 #1**：自己不是专业老师（数学/科学）
- **痛点 #2**：孩子缺同伴
- **痛点 #3**：portfolio 整理繁琐（州政府/学校申报）
- **痛点 #4**：不知道怎么评估
- **决策周期**：30 天试用 + 学期订阅（一年起算）
- **价格敏感度**：低（$14.99 是订阅习惯价格）

### 2.2 孩子侧

- **年龄**：5-12 岁（K-6）
- **风格**：Charlotte Mason / Classical / Montessori / Waldorf 4 选 1
- **痛点 #1**：没同伴（homeschool 最痛点）
- **痛点 #2**：学习节奏单调（只有妈妈/爸爸 1 个老师）
- **痛点 #3**：标准化考试怵（SAT/MAP/Iowa）
- **痛点 #4**：学习动力低（没人比、没人推）

### 2.3 典型周二上午

```
09:00 妈妈开始上课（数学），自己也紧张
09:15 孩子卡在分数，妈妈讲不清
09:30 妈妈查 google 看怎么讲
10:00 终于讲明白，但已经超时
10:15 孩子做练习，妈妈做午饭
11:00 写作课，妈妈要陪但又要洗碗
12:00 结束，妈妈累瘫
```

---

## 3. 痛点

### 3.1 共性 4 大痛点（见 [shared-architecture.md §2](./shared-architecture.md#2-universal-pain-points-cn--intl)）

- 缺专业辅导者
- 缺同伴
- 看不到掌握度
- 错题没人讲

### 3.2 INTL 专属痛点

| 痛点 | 强度 | 真实场景 |
|---|---|---|
| **缺同伴 / 社交缺失** | 🔴🔴🔴 | homeschool 最常见痛点 |
| **portfolio 整理繁琐** | 🔴🔴 | 州政府 / 学校申报，每周整理 |
| **curriculum 选择困难** | 🔴🔴 | Classical / Charlotte Mason / Montessori / Waldorf 选哪个 |
| **state law 跟踪** | 🔴🔴 | TX 自由但要 portfolio；CA 严格要测试 |
| **标准化考试怵** | 🔴 | SAT / MAP / Iowa 没人指导 |
| **配偶不支持** | 🟡 | 一个人扛 homeschool 压力大 |

---

## 4. 4 核心功能（INTL 形态）

### 4.1 AI Mentor「Ms. Maple」→ 解「缺专业辅导者」

**人设**：
- Warm Charlotte Mason guide（女性声音，MiniMax `female-warm-en`）
- Believes every child can love learning
- Asks "why" before "how"
- Reads nature with kids
- Narration over drill（让孩子口述，不打标准答案）

**Socratic prompt 核心规则**（与 CN 共用，但风格不同）：
1. Never give answers directly
2. Always ask "What do you think?" first
3. One-line hint if needed
4. Charlotte Mason spirit: short lessons (20min), nature observation, narration over drill
5. Mistakes are not failures — ask "Why did you choose this approach?"
6. Correct answer → brief affirmation + push deeper
7. Mood detection: 2 wrong in a row → encouraging tone
8. Memory isolation: you only know THIS student

### 4.2 2 Study Buddies → 解「缺同伴」

**同学池**（4 个模板，孩子选 2 个）：
- Emma📍Brooklyn——Curious girl, always raises hand first, asks "but why?" three times
- Noah📍San Diego——Honest boy, says when he's confused (kids love this), reads adventure books
- Mia📍Portland——Careful girl, double-checks work, loves animals and nature walks
- Theo📍Seattle——Quiet boy who thinks deeply, speaks rarely but wisely

**能力**：
- 主动提问：和 CN 同学类似
- 故意犯错：模拟同伴常见错误
- **跨州匹配**（v2）：从 INTL 用户池匹配真实 homeschool 孩子，定期视频讨论

### 4.3 Parent Weekly Digest → 解「看不到掌握度」

**推送渠道**：Email digest（每周日晚 7pm 当地时间）

**卡片 1**：本周掌握度
```
This week: Math 78% (↑5%), ELA 92% (→)
Focus area: 4.NF.A.2 Comparing fractions (45% mastery)
```

**卡片 2**：本周错题 TOP 3
```
1. Comparing fractions with unlike denominators (3 mistakes)
2. Word problem unit conversion (2 mistakes)
3. Reading comprehension inference (1 mistake)
```

**卡片 3**：本周建议
```
Suggestion: Review 4.NF.A.2 this weekend.
5 targeted practice problems auto-generated.
View details → [link]
```

### 4.4 Mistake Book + Spaced Repetition → 解「错题没人讲」

与 CN 类似，但存储方式不同：
- INTL 孩子可以**拍照 + 手写**入库（homeschool 多用纸质教材）
- 错题本自动整理成 **portfolio entry**
- 间隔重复曲线与 CN 相同（1/3/7/14 天）

---

## 5. INTL 专属功能

### 5.1 Email Weekly Digest（Resend）

**推送频率**：每周日 7pm 当地时间

**模板**：HTML email，3 卡片 + 错题图示 + 行动按钮

**技术**：
- Resend SDK（Email provider）
- Per-user timezone（自动换算推送时间）
- Opt-out 链接（CAN-SPAM / GDPR 合规）

### 5.2 WhatsApp Daily Nudge（可选）

**推送频率**：每日 8pm 当地（家长可关）

**内容**：1 句话 + 1 行动按钮
```
🌳 Time for today's nature observation!
Ms. Maple suggests: Go outside and find 3 leaves with different shapes.
[Open lesson →]
```

**技术**：
- WhatsApp Business Cloud API（Meta pre-approval）
- Per-user language + timezone
- 默认关闭，家长 onboarding 时 opt-in

### 5.3 Charlotte Mason Narration Mode

**核心**：让孩子口述阅读内容，不打标准答案

**设计**：
- 读一段（绘本 / 文章）→ 孩子口述理解
- mentor 不评判对错，只问"还想到什么？"
- 自动 voice-to-text 转录（ASR provider）
- 归档到 portfolio

**变体**：
- Classical：Socratic 重逻辑
- Montessori：hands-on 实物操作
- Waldorf：艺术化叙事

### 5.4 Portfolio Auto-Builder

**目标**：自动整理孩子作品集，每周生成 PDF portfolio

**内容来源**：
- Narration 转录（ASR）
- Quiz 成绩
- 错题本摘要
- 错题讲解视频回放（如果开启）
- Nature journal（自然观察照片 + 文字）

**输出**：PDF portfolio，结构按州/学校要求模板生成

### 5.5 State Law Tracker（按州生成模板）

**支持的州**（首批 5 个）：
- TX（Texas）：自由，但需要 portfolio
- CA（California）：每年标准化测试
- NY（New York）：提交 IHIP
- FL（Florida）：通知 + portfolio
- PA（Pennsylvania）： affidavit + portfolio

**自动跟踪**：
- 每年 state law 更新
- 模板自动调整
- 截止日期提醒

### 5.6 MAP / Iowa / SAT 备考包

**MAP（Measures of Academic Progress）**：
- 美国 50 州使用最广的标准化测试
- 备考包：数学 + 阅读 + 语言使用
- 考前 3 个月专项模式

**Iowa Test**：
- homeschool 常用
- 类似 MAP

**SAT**（初中预热）：
- PSAT 8/9 备考
- 阅读 + 数学 + 写作

---

## 6. 部署架构

### 6.1 AWS us-east-1（global 边缘）

| 组件 | 服务 |
|---|---|
| 服务器 | AWS ECS Fargate（us-east-1） |
| 数据库 | AWS RDS PostgreSQL（us-east-1，多 AZ） |
| 对象存储 | AWS S3（us-east-1） |
| CDN | AWS CloudFront（global edge） |
| 监控 | AWS CloudWatch |
| 密钥 | AWS Secrets Manager |

### 6.2 多 region 备份

- 数据库多 AZ 部署
- S3 跨 region 复制（备份用）
- 不存 PII 数据在 region 边缘

### 6.3 镜像构建

- monorepo `apps/intl/` 构建为独立 Docker 镜像
- INTL-only 环境变量（Resend / Stripe / WhatsApp）
- CI/CD：GitHub Actions → ECR → ECS

---

## 7. 推送 & 支付

### 7.1 推送渠道

| 渠道 | 用途 | 频率 | 状态 |
|---|---|---|---|
| **Email digest**（Resend） | 每周学习周报 | 每周日 7pm 当地时间 | v1 默认开启 |
| **WhatsApp nudge** | 每日轻量提醒 | 每日 8pm 当地时间 | v1 opt-in |
| **In-app notification** | 实时错题提醒 | 实时 | v1 默认开启 |
| **Web push**（PWA） | 浏览器推送 | 用户授权后 | v2 |

**关键设计**：
- Email digest 是主推送渠道（homeschool 妈妈偏好 email）
- WhatsApp 是次要（避免打扰）
- 每天推送 ≤ 1 条

### 7.2 支付

| 支付方式 | 用途 |
|---|---|
| **Stripe** | 订阅主推（USD / EUR / AUD / SGD） |
| **PayPal** | 备用 |

**订阅模式**：
- 月付 / 年付
- $14.99/月（单孩）/ $24.99/月（家庭 ≤3孩）
- 30 天免费试用（不需要信用卡）

**多币种**：
- USD（默认）
- EUR / AUD / SGD / GBP / CAD（按 IP 推测）
- 汇率：Stripe 自动换算

---

## 8. 合规

### 8.1 COPPA（美国 < 13 岁）

- **Parental consent**：注册时家长必须确认身份
- **Data minimization**：只收集必要数据
- **No behavioral advertising**：不投放行为广告
- **Parental access**：家长随时可查看 / 修改 / 删除孩子数据
- **学校记录 opt-in**（FERPA 关联）：默认 false

### 8.2 FERPA（美国教育记录隐私）

- 不与第三方共享教育记录
- 家长可导出所有数据（PDF + JSON）
- 学校记录 opt-in：用户主动开启才记录

### 8.3 GDPR-K（欧盟 < 16 岁）

- **Age of majority**：16（EU）/ 13（US COPPA）
- **Explicit parental consent**：注册时必须勾选
- **Right to be forgotten**：家长可一键删除所有数据
- **Data portability**：JSON 导出
- **DPIA**：每年审计

### 8.4 PDPA（新加坡）

- DNC（Do Not Call）注册：用户可一键 opt-out
- 30 天内处理 opt-out 请求

### 8.5 Privacy Act 1988（澳大利亚）

- APP 13 条原则遵守
- 跨境数据流披露（如果数据离开 AU）

### 8.6 State Law（美国各州 homeschool 法律）

- 自动跟踪 50 州 homeschool 法律变化
- Portfolio 模板按州生成
- 截止日期提醒（TX 9/1 / CA 10/15 等）

---

## 9. 定价

| Plan | 月付 | 年付（17% off） | 功能 |
|---|---|---|---|
| **Solo** | $14.99 | $149 | 1 孩子，Email digest，错题本 |
| **Family** | $24.99 | $249 | ≤3 孩子，Email digest，错题本，state law tracker |
| **Annual Premium** | — | $399 | Family + MAP/Iowa 备考包 + portfolio auto-builder |
| **试用** | 免费 30 天 | — | 全功能（无需信用卡） |

**多币种**：
- 默认 USD
- 当地货币显示（EUR / AUD / SGD / GBP / CAD）
- 汇率：Stripe 自动

**价格策略**：
- $14.99 是订阅习惯价格
- 年付折扣鼓励长期订阅
- 免费试用 30 天无需信用卡（转化率更高）

---

## 10. 5 主题 & 12 语种

### 10.1 默认主题

- **Warm-wood**（Charlotte Mason aesthetic）

### 10.2 可选主题

- Ocean（高对比度，WCAG 2.1 AA）
- Light / Dark

### 10.3 默认语言

- **en-US**

### 10.4 可选语言（12 语种）

zh-CN / zh-TW / en-US / ja-JP / ko-KR / ar-SA / pt-BR / es-MX / fr-FR / vi-VN / de-DE / ru-RU

---

## 11. MVP 阶段

### Phase 1 · 4 周 · 2-3 人 · 「MVP 上线」

| 模块 | 周 | 备注 |
|---|---|---|
| Web PWA 壳 | W1 | Next.js + responsive + 5 主题 |
| Mentor「Ms. Maple」 | W1-W2 | persona + Charlotte Mason Socratic prompt + MiniMax en-US voice |
| 2 Study Buddies | W2 | persona + 故意犯错 + 故意提问 |
| 错题本 + OCR | W2-W3 | 拍照 OCR + 错题入库 + 间隔重复 |
| Email Weekly Digest | W3 | Resend SDK + 3 卡片 + timezone |
| Stripe 订阅 | W4 | 月付 + 年付 + 30 天试用 |
| 部署（AWS） | W4 | us-east-1 + multi-AZ + GDPR consent |

### Phase 2 · 4 周 · 2 人 · 「扩展 + 5 主题 12 语种」

- WhatsApp Daily Nudge
- Portfolio Auto-Builder（PDF）
- State Law Tracker（首批 5 州）
- 5 主题 system 全套
- 12 语种 i18n 完整化

### Phase 3 · 6 周 · 1-2 人 · 「学习科学 + 备考包」

- MAP / Iowa 备考包
- Knowledge Graph
- Cross-state Buddy Matching（真 homeschool 孩子配对）
- Mentor 人格成长（家长反馈调整风格）
- 朗读评测（英文）

---

## 12. 团队

| 角色 | 人数 | 职责 |
|---|---|---|
| 产品经理 | 1 | 需求 / 运营 / homeschool 家长访谈 |
| 全栈工程师 | 1-2 | Web PWA + 后端 + 部署 |
| 内容运营 | 0.5 | mentor/buddy persona + Charlotte Mason prompt |
| 设计 | 0.5 | Web UI + Email 模板 |
| 合规法务 | 0.25 | COPPA / FERPA / GDPR-K 审计 |

**关键依赖**：
- Resend 账号（Email provider）
- WhatsApp Business Cloud API（Meta pre-approval）
- Stripe 账号（国际版）
- AWS 账号（us-east-1）

---

## 13. 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| COPPA 合规误操作 | 🔴🔴🔴 | 强制 parental consent + 每年法律审计 |
| State law 变化 | 🔴🔴 | 跟踪 50 州 homeschool 法律，季度审计 |
| Stripe 跨境问题 | 🔴 | 多币种 + PayPal 备用 + Paddle |
| GDPR-K 罚款 | 🔴🔴🔴 | 强制 opt-in + data deletion + DPIA |
| homeschool 市场规模小 | 🟡 | SEO + Reddit + YouTube 内容营销 |
| Charlotte Mason 市场细分 | 🟡 | 支持 4 种风格（Classical / Montessori / Waldorf）覆盖更广 |
| Email 投递到垃圾箱 | 🟡 | SPF/DKIM/DMARC + 优质内容 |
| WhatsApp template 审核 | 🔴🔴 | Meta 预审，多语言模板 |
