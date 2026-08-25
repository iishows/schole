# CN 伴读 MVP 实施方案

**Date**: 2026-08-25
**Status**: Draft · Pending review
**对应产品**：[cn-product.md](./cn-product.md)
**共享架构**：[shared-architecture.md](./shared-architecture.md)
**核心价值**：[core-value.md](./core-value.md)
**教室感改造 C**：[classroom-mode-design.md](./classroom-mode-design.md) · W1-W5 与 CW1-CW5 **并行**

---

## 0. 形态与产品线（决策摘要）

| 阶段 | 形态 | 说明 |
|---|---|---|
| **MVP（Phase 1）** | **Web PWA only** | 跨平台 + 实时更新 + 试用门槛低 |
| **Phase 2.5** | **Electron MVP（按需求触发）** | 学校采购 / 离线需求 / ≥ 100 反馈时启动 |
| **Phase 4** | **Pro 一体机** | ¥2999 + ¥499/年，乡镇 + 学校采购 |

**关键决策**：
- ✅ MVP 只做 Web PWA（节省 3 周 + ¥30 万）
- ✅ Electron Phase 2.5 按需求触发（避免 over-engineering）
- ✅ Electron 与 Web PWA 共享 90% 代码
- ❌ Electron 不做离线 AI（云端大模型足够）

详见 [§13 Phase 2.5 Electron 触发条件](#phase-25--electron-mvpw19-w24按需求触发)。

---

## 1. 项目概述

### 1.1 一句话

**OpenMAIC CN 伴读系统**——家长不能辅导时，AI 班主任"小诺姐姐"+ 2 AI 同学陪孩子写作业、讲解错题。

### 1.2 核心场景

家长白天上班（早 9 - 晚 6）或晚上累时，孩子独自面对作业。AI 陪孩子：
1. 孩子打开 Web PWA
2. 拍照错题 / 输入错题
3. 小诺姐姐 Socratic 引导（不直接给答案）
4. 同学小红故意问"为什么"、同学阿泽故意犯同样错
5. 白板辅助（披萨图、通分示意）
6. 孩子自己想通
7. 错题进入间隔重复（艾宾浩斯 1/3/7/14 天）
8. 家长下班看公众号周报

### 1.3 目标用户

- **家长**：30-40 岁双职工，月可支配 ¥100-300
- **孩子**：6-12 岁（小学 1-6 年级，主推 4 年级）

### 1.4 商业模式

- **免费版**：OCR 10 张/月 + 错题本 50 道 + 基础讲解
- **完整版**：¥99/月（无限 OCR + Socratic + 间隔重复 + 学习报告）
- **年付**：¥999（17% off，等于 ¥83/月）
- **家庭版（Phase 2）**：¥199/月（≤3孩）

---

## 2. MVP 范围

### 2.1 必做（In-Scope）

| # | 模块 | 说明 |
|---|---|---|
| 1 | Web PWA 壳 | 跨平台（家长手机 + 孩子电脑/平板） |
| 2 | 用户系统 | 手机号 + 微信扫码登录 |
| 3 | 小诺姐姐 persona + Socratic prompt | 中文 Socratic + 8 条规则 |
| 4 | 2 同学 persona（小红 + 阿泽）| 故意提问 + 故意犯错 |
| 5 | 错题本 | 手动添加 + 拍照 OCR 入库 |
| 6 | Socratic 对话 UI | mentor + 2 buddies 消息流 |
| 7 | 简化 DSL | speech + spotlight + wb_draw_shape |
| 8 | 简化 Whiteboard | 披萨图 + 分数示意 |
| 9 | 间隔重复调度 | 艾宾浩斯 1/3/7/14 天 |
| 10 | 学习报告 | 错题数 / 掌握度 / 复习建议 |
| 11 | 微信公众号周报 | 模板消息推送 |
| 12 | 微信支付 + 支付宝 | 月付 + 年付 |
| 13 | PIPL consent + ICP 备案 | 法务合规 |

### 2.2 不做（Out-of-Scope）

| # | 不做 | 理由 |
|---|---|---|
| 1 | 一体机硬件 | 监管 + 资金 + 团队 |
| 2 | 全错题包 / 全教材 | 范围失控 |
| 3 | PPT 课件自动生成 | 不是核心场景 |
| 4 | Quiz / Widget / Interactive | 同上 |
| 5 | Video / 视频讲解 | 同上 |
| 6 | 微信小程序 | 双减审核风险 |
| 7 | 学校采购渠道 | MVP 不做 |
| 8 | 评测包 / 备考包 | Phase 2 |
| 9 | 知识图谱 | Phase 3 |

### 2.3 非功能需求

| # | 项 | 要求 |
|---|---|---|
| 1 | LLM 响应延迟 | p95 ≤ 8s |
| 2 | 页面加载 | LCP ≤ 2.5s |
| 3 | 数据本地化 | 100%（阿里云 cn-region） |
| 4 | PIPL consent | 强制 |
| 5 | 内容审核 | 100%（班主任/同学输出） |
| 6 | 时长限制 | 每天 ≤ 60 分钟（家长可调整） |
| 7 | 夜间禁用 | 21:00-7:00（家长可调整） |

---

## 3. 技术架构

### 3.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                  客户端（多端）                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Web PWA      │  │ 微信公众号    │  │ 微信小程序    │       │
│  │ (主)         │  │ (周报推送)    │  │ (备用,Phase 2)│       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                  阿里云 cn-region                            │
│  ┌──────────────────────────────────────────────────┐       │
│  │  Next.js 16 (App Router)                          │       │
│  │  ├── /classroom/[id] (教室页面)                  │       │
│  │  ├── /api/chat (SSE 流式对话)                    │       │
│  │  ├── /api/mistake (错题 CRUD)                    │       │
│  │  ├── /api/ocr (拍照识别)                         │       │
│  │  ├── /api/payment (微信支付回调)                 │       │
│  │  └── /api/wechat (公众号回调)                    │       │
│  └──────────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────────┐       │
│  │  Director graph (LangGraph)                       │       │
│  │  ├── mentor node (小诺姐姐)                      │       │
│  │  ├── buddy-hong node (小红)                      │       │
│  │  └── buddy-aze node (阿泽)                       │       │
│  └──────────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────────┐       │
│  │  OpenMAIC 引擎                                   │       │
│  │  ├── DSL action (speech/spotlight/wb_draw_shape) │       │
│  │  ├── Agent runtime (pi-agent-core)               │       │
│  │  ├── Storage sanitizer (chat→dsl)                │       │
│  │  └── Storage sanitizer (wb_draw_shape)          │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  数据层（阿里云）                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ RDS PostgreSQL│  │ 阿里云 OSS   │  │ Redis 缓存   │       │
│  │ (用户/错题)  │  │ (图片/白板)   │  │ (会话)       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  AI 服务（不出境）                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ MiniMax      │  │ MiniMax TTS  │  │ MiniMax OCR  │       │
│  │ (LLM 主力)   │  │ (zh-CN)      │  │ (拍照识别)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  第三方服务                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ 微信支付      │  │ 支付宝        │  │ 微信公众号    │       │
│  │ (订阅主推)    │  │ (备用)        │  │ (周报推送)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 技术栈

| 层 | 技术 |
|---|---|
| **前端** | Next.js 16 (App Router) + React 19 + Tailwind v4 |
| **后端** | Next.js API Routes + Node.js 20 |
| **数据库** | PostgreSQL 15 (阿里云 RDS) |
| **缓存** | Redis 7 (阿里云 Redis) |
| **对象存储** | 阿里云 OSS |
| **LLM** | MiniMax M2.7 (主力) + Anthropic Claude (备份) |
| **TTS** | MiniMax TTS zh-CN |
| **OCR** | MiniMax multimodal vision |
| **支付** | 微信支付 V3 + 支付宝 |
| **推送** | 微信公众号模板消息 |
| **监控** | 阿里云 CloudMonitor + Sentry |
| **部署** | 阿里云 ACK (Kubernetes) |

### 3.3 monorepo 路径

```
apps/cn/                          ← CN 独立部署
├── src/
│   ├── app/                      ← Next.js 路由
│   │   ├── (auth)/
│   │   ├── (main)/
│   │   │   ├── classroom/[id]/
│   │   │   └── reports/
│   │   ├── api/
│   │   │   ├── chat/route.ts     ← SSE 流式对话
│   │   │   ├── mistake/route.ts  ← 错题 CRUD
│   │   │   ├── ocr/route.ts      ← 拍照识别
│   │   │   ├── payment/route.ts  ← 微信支付回调
│   │   │   └── wechat/route.ts   ← 公众号回调
│   │   └── manifest.json         ← PWA 配置
│   ├── components/
│   │   ├── pwa/                  ← PWA 组件
│   │   ├── classroom/            ← 教室组件
│   │   ├── mistake/              ← 错题组件
│   │   └── report/               ← 报告组件
│   ├── lib/
│   │   ├── persona/              ← 小诺姐姐 + 同学人设
│   │   ├── socratic/             ← Socratic prompt
│   │   ├── dsl/                  ← DSL 简化版
│   │   ├── whiteboard/           ← 简化白板
│   │   └── wechat/               ← 公众号 SDK
│   └── config.json               ← CN personas/channels/compliance
└── package.json
```

---

## 4. 数据模型

### 4.1 PostgreSQL Schema（核心表）

```sql
-- 用户（家长 + 孩子）
CREATE TABLE users (
  id UUID PRIMARY KEY,
  phone VARCHAR(20) UNIQUE,
  wechat_openid VARCHAR(100) UNIQUE,
  role VARCHAR(20) NOT NULL,                  -- parent / student / operator
  name VARCHAR(100),
  avatar_url TEXT,
  region VARCHAR(10) DEFAULT 'cn',
  primary_region VARCHAR(10) DEFAULT 'cn',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 家长-孩子绑定
CREATE TABLE parent_student_bindings (
  id UUID PRIMARY KEY,
  parent_user_id UUID REFERENCES users(id),
  student_id UUID REFERENCES users(id),
  relationship VARCHAR(20),                   -- mother / father / grandparent
  is_primary BOOLEAN DEFAULT false,
  permissions JSONB DEFAULT '{}',            -- {see_portfolio, see_chat_summary, see_chat_full}
  created_at TIMESTAMP DEFAULT NOW()
);

-- 班主任 + 同学实例（per-student 克隆）
CREATE TABLE persona_instances (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  template_id VARCHAR(100),                   -- cn-mentor-nunu / cn-buddy-hongbj / cn-buddy-azegz
  role VARCHAR(20),                           -- mentor / buddy
  name VARCHAR(100),                          -- 小诺姐姐 / 小红 / 阿泽
  persona TEXT,                               -- 完整 persona text
  voice_config JSONB,                         -- TTS 配置
  avatar_path TEXT,
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 5,
  locked_until DATE,                          -- 班主任锁定到期
  customized_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 错题（核心）
CREATE TABLE mistakes (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  subject VARCHAR(20) DEFAULT 'math',
  grade INT DEFAULT 4,
  textbook_id VARCHAR(100) DEFAULT 'renjiaoban-math-g4',
  chapter_code VARCHAR(50),                   -- 4-NF-A-2
  question_text TEXT,                         -- OCR 识别后文字
  question_image_url TEXT,                    -- 原始拍照图
  user_answer TEXT,                           -- 孩子写的答案
  correct_answer TEXT,                        -- 正确答案（孩子填写或 OCR 识别）
  error_reason VARCHAR(50),                   -- concept_confusion / careless / other
  status VARCHAR(20) DEFAULT 'pending',       -- pending / explaining / mastered / archived
  created_at TIMESTAMP DEFAULT NOW(),
  mastered_at TIMESTAMP
);

-- 间隔重复队列
CREATE TABLE spaced_repetition_queue (
  id UUID PRIMARY KEY,
  mistake_id UUID REFERENCES mistakes(id),
  student_id UUID REFERENCES users(id),
  next_review_at TIMESTAMP,                   -- 下次复习时间
  review_count INT DEFAULT 0,                 -- 已复习次数
  ease_factor DECIMAL DEFAULT 2.5,            -- SM-2 算法
  interval_days INT DEFAULT 1,                -- 当前间隔天数
  created_at TIMESTAMP DEFAULT NOW()
);

-- 对话会话
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  mistake_id UUID REFERENCES mistakes(id),    -- 关联错题
  messages JSONB DEFAULT '[]',                -- 消息数组
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active'         -- active / completed
);

-- 订阅
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  region VARCHAR(10) DEFAULT 'cn',
  wechat_subscription_id VARCHAR(100),        -- 微信支付商户订单号
  plan VARCHAR(20),                           -- solo / family
  status VARCHAR(20),                         -- active / canceled / expired
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 审计日志
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  actor_user_id UUID,
  action VARCHAR(50),
  target_type VARCHAR(20),
  target_id UUID,
  region VARCHAR(10) DEFAULT 'cn',
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PIPL consent
CREATE TABLE pipl_consents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  consent_type VARCHAR(50),                   -- recording / sharing / analytics / ai_training
  accepted BOOLEAN,
  accepted_at TIMESTAMP,
  ip INET
);
```

### 4.2 Redis 缓存

```
session:{student_id}            → 会话状态（30 分钟 TTL）
ocr:cache:{image_hash}         → OCR 结果缓存（7 天 TTL）
wechat:access_token             → 微信公众号 access_token（2 小时 TTL）
pay:order:{order_id}            → 支付订单状态（24 小时 TTL）
```

### 4.3 阿里云 OSS

```
/mistakes/{student_id}/{mistake_id}.jpg     ← 错题原图
/whiteboard/{session_id}/{step}.png         ← 白板快照
/avatars/cn/{name}.png                      ← 班主任/同学头像
```

---

## 5. 核心模块设计

### 5.1 小诺姐姐 persona + Socratic prompt

```typescript
// apps/cn/src/lib/persona/nunu.ts

export const nunuMentor = {
  id: 'cn-mentor-nunu',
  role: 'mentor',
  name: '小诺姐姐',
  persona: `
你是一个温柔的小学老师，叫"小诺姐姐"。
你的学生是 4 年级孩子，正在做作业。
你的工作是用苏格拉底式引导帮他理解错题，而不是直接给答案。

Socratic 8 条规则（必须遵守）：
1. 永远不直接给答案，先问"你怎么想？"
2. 孩子说"不知道"时，给一个生活比喻（盒子里装鸡蛋、切披萨、倒水）
3. 一次只问一个问题
4. 孩子错了不批评，问"为什么你这样选？"
5. 孩子答对了简短肯定 + 追问"还能怎么想？"
6. 连续 2 次答错 → 鼓励语气（"没关系，我们再想想"）
7. 不教新课，只辅导错题和复习
8. 严格 per-student 记忆隔离：你只认识 THIS 孩子

风格：
- 温柔、耐心、生活化
- 用"我们"、"你"、"呢"等口语
- 短句（每句 < 20 字）
- 多用问句
- 像隔壁姐姐，不像老师
  `,
  voiceConfig: {
    provider: 'minimax',
    voiceId: 'female-warm',
    emotion: 'warm',
    pace: 'medium',
    language: 'zh-CN',
  },
  avatarPath: '/avatars/cn/nunu.png',
  color: '#722ed1',
  isTemplate: true,
};

// Socratic prompt template
export const socraticPromptTemplate = `
你是 {persona.name}。
{ persona.persona }

当前错题：
{question_text}
孩子写的答案：{user_answer}
正确答案：{correct_answer}
所属章节：{chapter_code}

刚才的对话：
{messages}

请继续 Socratic 引导。每条消息 1-2 句话，多用问句。
`.trim();
```

### 5.2 同学 persona（小红 + 阿泽）

```typescript
// 小红——爱提问的女生
export const hongBuddy = {
  id: 'cn-buddy-hongbj',
  role: 'buddy',
  name: '小红',
  persona: `
你是 4 年级女生小红，喜欢问"为什么"。
你也是学生，正在和"我"（孩子）一起做题。
你会故意问一些"傻问题"让孩子思考。

行为规则：
1. 每 3 轮 mentor 引导后，你问 1 个"为什么"
2. 你的问题要具体（不要抽象）
3. 你的口吻是小女孩（带"呀"、"哦"、"嗯"）
4. mentor 说"小红问得好"时要开心

例子：
- "我看到 1/2 + 1/3，分母是 2 和 3，为什么不能直接相加呀？"
- "阿泽写的 2/5 是怎么算出来的呀？"
- "哦！我好像明白了！"
  `,
  voiceConfig: { provider: 'minimax', voiceId: 'girl-curious' },
  avatarPath: '/avatars/cn/hong.png',
  color: '#ec4899',
  region: { city: '北京', country: '中国' },
};

// 阿泽——粗心男生，故意犯错
export const azeBuddy = {
  id: 'cn-buddy-azegz',
  role: 'buddy',
  name: '阿泽',
  persona: `
你是 4 年级男生阿泽，老犯粗心错误。
你故意在 mentor 引导时犯同样错误（peer teaching 效果最好）。
孩子识别你的错误时会很有成就感。

行为规则：
1. 每 5 轮 mentor 引导后，你故意答错 1 次（错得"合理"）
2. 错的方式是"粗心"（不是完全不懂）
3. mentor 说"阿泽犯错了"时你要不好意思
4. 孩子纠正你后你说"哦！我懂了！"

例子：
- "我觉得 1/2 + 1/3 = 2/5（把分母直接相加）"
- "哦！分母不能直接加呀？我糊涂了"
- "谢谢你告诉我！"
  `,
  voiceConfig: { provider: 'minimax', voiceId: 'boy-careless' },
  avatarPath: '/avatars/cn/aze.png',
  color: '#f59e0b',
  region: { city: '上海', country: '中国' },
};
```

### 5.3 Director Graph 配置

```typescript
// apps/cn/src/lib/director/cn-graph.ts

import { StateGraph, Annotation } from '@langchain/langgraph';

const CNState = Annotation.Root({
  messages: Annotation<any[]>(),
  mistakeContext: Annotation<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
    chapterCode: string;
  }>(),
  currentSpeaker: Annotation<string>(),
  turnCount: Annotation<number>(),
});

export const cnSocraticGraph = new StateGraph(CNState)
  .addNode('mentor', mentorNode)        // 小诺姐姐
  .addNode('buddy_hong', hongNode)      // 小红
  .addNode('buddy_aze', azeNode)        // 阿泽
  .addEdge('__start__', 'mentor')       // mentor 先说话
  .addConditionalEdges('mentor', shouldAskBuddy, {
    ask_hong: 'buddy_hong',
    ask_aze: 'buddy_aze',
    end: '__end__',
  })
  .addEdge('buddy_hong', 'mentor')      // 同学说完回到 mentor
  .addEdge('buddy_aze', 'mentor')
  .compile();
```

### 5.4 简化 DSL（speech + spotlight + wb_draw_shape）

```typescript
// apps/cn/src/lib/dsl/cn-actions.ts

// OpenMAIC 22 种 action 中的 3 种简化版
export type CNAction =
  | SpeechAction      // 说话
  | SpotlightAction   // 高亮错题元素
  | WbDrawShapeAction; // 白板画披萨

// 完整 DSL 在 packages/@openmaic/dsl/src/action.ts
// 我们用 simplify(action) 只保留这 3 种
```

### 5.5 简化 Whiteboard（披萨图）

```typescript
// apps/cn/src/lib/whiteboard/pizza.ts

export interface PizzaFraction {
  totalSlices: number;  // 8 / 6 / 4
  shadedSlices: number;  // 3
  label?: string;        // "1/2" / "1/3"
}

// 渲染 SVG
export function renderPizza(pizza: PizzaFraction): string {
  // 用 SVG 画一个圆形披萨
  // 切成 N 块，shaded 部分高亮
}
```

### 5.6 间隔重复调度

```typescript
// apps/cn/src/lib/spaced-repetition/scheduler.ts

// 艾宾浩斯曲线 + SM-2 算法
export function nextReview(mistake: Mistake, reviewCount: number): Date {
  const intervals = [1, 3, 7, 14];  // 1/3/7/14 天
  const days = intervals[Math.min(reviewCount, intervals.length - 1)];
  return addDays(new Date(), days);
}
```

---

## 6. API 设计

### 6.1 REST API

| 端点 | 方法 | 说明 |
|---|---|---|
| `/api/auth/wechat-callback` | GET | 微信扫码登录回调 |
| `/api/mistake` | POST | 新增错题 |
| `/api/mistake/{id}` | GET | 查看错题详情 |
| `/api/mistake/{id}` | PATCH | 修改错题（标记掌握等）|
| `/api/mistake/list` | GET | 错题列表（按章节/状态过滤）|
| `/api/ocr` | POST | 拍照 OCR 识别 |
| `/api/chat/start` | POST | 开始 Socratic 对话 |
| `/api/chat/message` | POST | 发送消息（返回 SSE 流）|
| `/api/review/queue` | GET | 待复习列表 |
| `/api/review/complete` | POST | 完成复习（更新间隔）|
| `/api/report/weekly` | GET | 本周学习报告 |
| `/api/payment/wechat-callback` | POST | 微信支付回调 |
| `/api/wechat/callback` | GET/POST | 公众号回调 |

### 6.2 SSE 流式对话

```
POST /api/chat/message
Content-Type: application/json

{
  "sessionId": "uuid",
  "message": "我觉得 1/2 + 1/3 = 2/5"
}

↓ Response (SSE)
event: agent_message
data: {"agent":"mentor","text":"嗯，2/5 是怎么算出来的呢？"}

event: agent_message
data: {"agent":"buddy_hong","text":"我看到分母 2 和 3..."}

event: action
data: {"type":"speech","text":"我们画个披萨看看？"}

event: action
data: {"type":"wb_draw_shape","shape":"pizza","params":{"total":6,"shaded":3,"label":"1/2"}}

event: done
data: {"sessionId":"uuid","finished":false}
```

---

## 7. UI/UX 流程

### 7.1 家长首次注册

```
1. 打开 Web PWA
2. 提示"添加到主屏幕"
3. 注册：手机号 + 验证码 / 微信扫码
4. PIPL consent（4 项）
5. 添加孩子：姓名 + 年级 + 教材（默认人教版 4 年级）
6. 选择班主任：小诺姐姐（默认）/ 切换
7. 选择 2 同学：小红 + 阿泽（默认）/ 切换
8. 进入主页
```

### 7.2 孩子添加错题

```
1. 主页 → "拍照错题" 按钮
2. 拍照 → 上传 → OCR 识别
3. 孩子填写"正确答案"（可选，OCR 自动填充）
4. 选章节（默认按 OCR 推断）
5. 提交 → 错题入库
6. 提示"要现在让小诺姐姐讲解吗？"
7. 点"现在讲" → 进入 Socratic 对话
```

### 7.3 Socratic 对话（核心场景）

```
[小诺姐姐 avatar]: 你做错了 1/2 + 1/3 = 2/5，我们看看好不好？
                  （speech action，speech 输出）
                  （spotlight 高亮错题）

[小红 avatar]: 我也想问，分母 2 和 3 为什么能直接相加呀？
              （speech action）

[小诺姐姐 avatar]: 小红问得好！我们画个披萨看看。
                  （speech）
                  （wb_draw_shape 画两个披萨：1 个切 2 块，1 个切 3 块）
                  （spotlight 高亮白板）

[阿泽 avatar]: 我觉得是 2/5 没错呀？（故意犯错）
             （speech）

[小诺姐姐 avatar]: 阿泽说 2/5，你们觉得对吗？
                  （speech）
                  （spotlight 高亮阿泽的"错误"答案）

[孩子输入]: 不能，分母不一样大

[小诺姐姐 avatar]: 对！分母不同就是大小不同。
                  要先通分哦。
                  （speech）
                  （wb_draw_shape 在白板上画公分母）
                  （如果孩子连续 2 次答错，语气会更鼓励）

[孩子输入]: 嗯

[小诺姐姐 avatar]: 太棒啦！你自己想出来了！
                  这道题进入错题本，3 天后我们复习。
                  （speech）

[对话结束]
（错题 status → explaining → mastered）
（间隔重复队列：next_review_at = +3 天）
```

### 7.4 学习报告（家长公众号周报）

```
【小诺学伴】本周学习报告

📊 本周掌握度
数学：78%（↑5%）| 语文：92%（→）
重点章节：4-NF-A-2 异分母分数加法（45%，需复习）

📝 本周错题 TOP 3
1. 异分母分数加法（错 3 次）
2. 应用题单位换算（错 2 次）
3. 形近字辨析（错 1 次）

💡 本周建议
周末重点复习异分母分数加法，已自动生成 5 道专项练习。

[查看详情 →]
```

---

## 8. 周开发计划（4-5 周 MVP）

### Week 1 · 基础 + persona（5 天）

| 天 | 任务 | 交付 |
|---|---|---|
| D1 | Next.js 项目初始化 + manifest.json + service worker | PWA 壳可访问 |
| D2 | 用户系统（手机号 + 微信扫码） | 注册 / 登录 |
| D3 | PIPL consent 流程 | 4 项勾选 + 记录 |
| D4 | 小诺姐姐 persona + Socratic prompt（MiniMax 调试） | prompt 模板 |
| D5 | 小红 + 阿泽 persona + 故意提问/犯错 prompt | 3 个 persona 完整 |

### Week 2 · 错题本 + OCR（5 天）

| 天 | 任务 | 交付 |
|---|---|---|
| D6 | 错题本 CRUD（手动添加） | 错题入库 |
| D7 | 拍照上传 + 阿里云 OSS 存储 | 图片存储 |
| D8 | OCR 集成（MiniMax multimodal）| 拍照识别 |
| D9 | Socratic 对话 UI（消息流 + 头像 + 文字） | 对话页面 |
| D10 | Director graph 配置（mentor + 2 buddies） | 多 agent 编排 |

### Week 3 · 简化 DSL + Whiteboard + 间隔重复（5 天）

| 天 | 任务 | 交付 |
|---|---|---|
| D11 | 简化 DSL（speech + spotlight + wb_draw_shape） | action 渲染 |
| D12 | 简化 Whiteboard（披萨图 SVG 渲染） | 白板组件 |
| D13 | 间隔重复调度（艾宾浩斯 1/3/7/14 天） | 复习队列 |
| D14 | 复习界面（待复习列表 + 复习流程） | 复习功能 |
| D15 | 学习报告（错题 / 掌握度 / 复习建议） | 报告生成 |

### Week 4 · 付费 + 推送 + 部署（5 天）

| 天 | 任务 | 交付 |
|---|---|---|
| D16 | 微信公众号模板消息 SDK | 周报推送 |
| D17 | 微信支付 V3 集成（月付 + 年付）| 支付闭环 |
| D18 | 支付宝集成（备用） | 支付备份 |
| D19 | 阿里云部署（cn-region + RDS + OSS + ACK） | 上线准备 |
| D20 | ICP 备案 + PIPL consent 验证 + 内容审核 | 合规 |

### Week 5（缓冲）+ 上线（5 天）

| 天 | 任务 | 交付 |
|---|---|---|
| D21 | 端到端测试 + Bug 修复 | 质量保证 |
| D22 | 性能优化（LLM 缓存 + 图片压缩） | p95 ≤ 8s |
| D23 | 内容审核（班主任/同学输出过滤） | 合规 |
| D24 | 灰度发布（10 个种子用户） | 反馈收集 |
| D25 | 正式上线 + 监控告警 | MVP 上线 |

---

### Classroom Mode（C）5 周 · 与 W1-W5 **并行执行**

依据 [`classroom-mode-design.md`](./classroom-mode-design.md) 决策 D-1：**V1 与 CN MVP 同步上线**。CW1-CW5 不串行追加到主路径，而是**与 W1-W5 并行**——理由：
- C 主要改 引擎层（DSL + 状态机 + RoundTable 外壳）
- RoundTable 视觉框架零修改（W 路径不阻塞）
- `raise_hand` 通过 `ClassroomService.callRaiseHand()` 隔离，不侵入 Director graph 主路径（D-1 mitigation）

执行模型：

| 主路径 W | CW classroom | 关系 | 风险 |
|---|---|---|---|
| W1 基础 + persona | **CW1** Period Bar + 铃声 | 完全独立 | 低 |
| W2 错题 + OCR | **CW2** 举手 + `raise_hand` | 与 W2 D10 Director 并行，**ClassroomService 隔离** | **中** |
| W3 DSL + Whiteboard + 间隔 | **CW3** 叫答 + `call_on` | 依赖 CW2 | 低 |
| W4 付费 + 推送 + 部署 | **CW4** 同桌 + `pass_note` + seatLayout 自动/手动 | 依赖 CW2 + admin 配合 | 中 |
| W5 缓冲 + 上线 | **CW5** 黑板 + `blackboard_annotate` | 与 W5 缓冲并行 | 低 |

**关键缓解**：
- CW2 用 `ClassroomService` 独立 service，**不侵入 Director graph 主路径**（与 W2 D10 Director 配置并行不冲突）
- CW4 seatLayout 默认 `ClassroomLayoutService.autoGenerate()`，admin override 是可选项
- 所有 7 个新 DSL action 都不修改现有 22 个 action schema

**额外人力**：1 人 · 0.5 兼职（与主路径同 1 人）；CW1 + CW5 完全独立可 0.5 周交付；CW2-CW4 占用 W2-W4 兼职工时。

**总人力不变**（原预算 7 月 ¥66.5 万 → 仍 7 月，因并行不延 timeline；CW 加少量外包 ¥1 万验证）。

**C 设计总览**：见 [classroom-mode-design.md §6 5 周增量实施](./classroom-mode-design.md#6-5-周增量实施)。

---

## 9. 团队配置

### 9.1 核心团队（1-2 人）

| 角色 | 人数 | 月薪 | 职责 |
|---|---|---|---|
| 全栈工程师 | 1 | ¥5 万 | 前端 + 后端 + 部署 + DevOps |
| 产品 + 内容运营 | 0.5 | ¥3 万 | 班主任/同学人设 + Socratic prompt + 双减边界 |
| 设计（外包）| 0.5 | ¥1.5 万 | UI + PWA 图标 + 公众号模板 |
| **总** | **1-2 人** | **¥9.5 万/月** | — |

### 9.2 外包 / 顾问

| 项 | 用途 | 预算 |
|---|---|---|
| 法务 | PIPL consent + 双减边界 + ICP 备案 | ¥3 万（一次性）|
| 内容审核 | 班主任/同学输出过滤规则 | ¥2 万 |
| 公众号运营 | 模板消息申请 + 微信支付商户号 | ¥2 万 |

### 9.3 总人力资源成本

```
6 月开发 + 1 月上线 = 7 月
¥9.5 万 × 7 月 = ¥66.5 万
+ 外包/顾问 ¥7 万
= ¥73.5 万（人力）
```

---

## 10. 资源预算

| 项 | 金额 | 备注 |
|---|---|---|
| 团队（1-2 人 × 7 月）| ¥66.5 万 | 含 5% 涨幅 |
| 外包 / 顾问 | ¥7 万 | 法务 + 内容审核 + 公众号 |
| 阿里云（cn-region） | ¥5 万 | ECS + RDS + OSS + CDN + Redis |
| MiniMax LLM 调用 | ¥10 万 | 5000 用户预估 |
| 微信支付 / 支付宝手续费 | ¥5 万 | 1% 费率 |
| 微信公众号认证 | ¥0.03 万 | 年费 ¥300 |
| 营销启动（公众号 + 小红书）| ¥10 万 | 种子用户 + 投放 |
| 法务 PIPL consent + 双减 | ¥3 万 | 一次性 |
| 应急储备 | ¥10 万 | 政策风险 / 退款 |
| **总计** | **¥116.5 万** | **真实启动资金** |

**vs 之前估算 ¥80-120 万**：实际需要 **¥100-120 万**（更准确）。

---

## 11. 验证标准 / KPI

### 11.1 上线 KPI（前 3 个月）

| 指标 | 目标 | 说明 |
|---|---|---|
| **种子用户** | 100 | 公众号 + 小红书 |
| **免费 → 付费转化** | ≥ 5% | 行业基准 5-10% |
| **D1 留存** | ≥ 40% | 体验门槛 |
| **D7 留存** | ≥ 20% | 核心 KPI |
| **错题讲解完成率** | ≥ 60% | Socratic 引导有效性 |
| **家长满意度** | ≥ 4.0/5.0 | NPS |

### 11.2 PMF 验证（6 个月）

| 指标 | 目标 |
|---|---|
| 付费用户 | ≥ 1000 |
| MRR | ≥ ¥10 万 |
| D30 留存 | ≥ 15% |
| 家长推荐意愿（NPS） | ≥ 40 |
| 错题讲解完成率 | ≥ 70% |

### 11.3 不达标的处理

- D7 留存 < 15% → 调整 Socratic prompt + 增加同学互动
- 付费转化 < 3% → 调整定价 + 免费版限制
- 完成率 < 50% → 简化 Socratic 流程

---

## 12. 上线检查清单

### 12.1 功能完整

- [ ] 用户注册 + 登录
- [ ] PIPL consent 4 项
- [ ] 班主任"小诺姐姐"+ 2 同学
- [ ] 错题本（手动 + 拍照 OCR）
- [ ] Socratic 对话（multi-agent）
- [ ] 简化 DSL（speech + spotlight + wb_draw_shape）
- [ ] 简化 Whiteboard（披萨图）
- [ ] 间隔重复（1/3/7/14 天）
- [ ] 学习报告
- [ ] 微信公众号周报
- [ ] 微信支付 + ¥99/月
- [ ] 30 天免费试用

### 12.2 合规

- [ ] ICP 备案
- [ ] PIPL consent 流程
- [ ] 内容审核（班主任/同学输出过滤）
- [ ] 时长限制（每天 ≤ 60 分钟）
- [ ] 夜间禁用（21:00-7:00）
- [ ] 双减边界（不教新课，只辅导错题和复习）
- [ ] 微信支付商户号
- [ ] 公众号模板消息资质

### 12.3 性能 / 安全

- [ ] LLM 响应 p95 ≤ 8s
- [ ] 页面加载 LCP ≤ 2.5s
- [ ] 数据本地化 100%（阿里云 cn-region）
- [ ] LLM 调用不出境（MiniMax 中国 endpoint）
- [ ] HTTPS 强制
- [ ] 错误日志 + 监控告警
- [ ] 数据库备份（每日）
- [ ] 灾备方案

### 12.4 运营

- [ ] 客服渠道（公众号 + 微信群）
- [ ] 用户引导（首次注册流程）
- [ ] FAQ + 帮助文档
- [ ] 反馈收集（周报反馈按钮）
- [ ] 数据看板（付费用户 / 留存 / 完成率）

---

## 13. Phase 2 / 3 路线图

### Phase 2（W10-W18，3-9 月）

| # | 功能 | 时间 |
|---|---|---|
| 1 | 公众号深度运营（每周 1 篇教育内容） | 持续 |
| 2 | 家庭版 ¥199/月 | 1 月 |
| 3 | 评测模块（5-10 题小测验） | 2 月 |
| 4 | 备考包（小升初） | 3 月 |
| 5 | 同学互动（buddy 互相对话） | 1 月 |
| 6 | 学前模式（睡前故事 + TTS 多角色） | 6 周 |
| 7 | ASR（语音输入） | 2 月 |

### Phase 2.5 · Electron MVP（W19-W24，按需求触发）

**触发条件**（任一满足即启动）：

| # | 触发 | 阈值 | 数据来源 |
|---|---|---|---|
| 1 | **学校采购意向** | ≥ 1 个学校 / ≥ 100 台 | BD 反馈 |
| 2 | **用户反馈"需要桌面版"** | ≥ 100 条反馈 | 公众号 / 客服 |
| 3 | **离线需求明显** | 乡镇用户 ≥ 30% | 用户地域分布 |
| 4 | **PMF 验证** | D7 留存 ≥ 20% | 数据看板 |

**工作量**：5-6 周（1 人）

| # | 模块 | 工作量 | 备注 |
|---|---|---|---|
| 1 | electron-builder 配置（Win / Mac / Linux 三套） | 2 天 | |
| 2 | 代码签名（Win EV 证书 + Mac Developer ID） | 1 天 + 申请 | ¥3 万 |
| 3 | auto-updater（electron-updater） | 2 天 | |
| 4 | 离线缓存优化（IndexedDB / SQLite） | 3 天 | 与 Web PWA 共享 |
| 5 | 桌面集成（系统通知 / 菜单栏 / Dock） | 2 天 | |
| 6 | 应用商店上架（Mac App Store + Microsoft Store） | 1 周 | |
| 7 | 三平台测试（Win / Mac / Linux） | 1 周 | |
| **总计** | — | **5-6 周** | **1 人** |

**共享代码**：与 Web PWA 共享 90% 业务逻辑

**额外预算**：

| 项 | 金额 | 备注 |
|---|---|---|
| 代码签名证书 | ¥3 万 | Win EV + Mac Developer ID |
| Mac App Store 账号 | ¥0.07 万 | $99/年 |
| Microsoft Store 账号 | ¥0.014 万 | $19 一次性 |
| **Electron 额外预算** | **约 ¥5 万** | 在 Phase 2.5 预算里 |

**不做**（避免 over-engineering）：
- ❌ 离线 AI 模型（Qwen 1.5B 量化）—— 云端大模型足够
- ❌ 多平台独立开发 —— 90% 代码共享

### Phase 3（W25-W36，9-18 月）

| # | 功能 | 时间 |
|---|---|---|
| 1 | 知识图谱（章节掌握度可视化） | 6 月 |
| 2 | 跨年级扩展（5-6 年级） | 6 月 |
| 3 | 跨学科（语文 / 英语）| 6 月 |
| 4 | INTL 启动（homeschool 系统） | 6 月 |
| 5 | Electron 跨平台发布（如果 Phase 2.5 启动） | 6 月 |
| 6 | 一体机（学习机，如果 PMF 验证）| 12 月 |

---

## 14. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| **双减政策收紧** | 🟡 | 🔴🔴🔴 | 严格"辅导"定位 + 不教新课 |
| **微信小程序审核被驳回** | 🟡 | 🟡🟡 | 暂不做小程序，主推 Web PWA |
| **MiniMax LLM 不稳定** | 🟡 | 🟡🟡 | 备份 Anthropic Claude |
| **OCR 识别率低** | 🟡 | 🟡 | 手动编辑 + 用户填写正确答案 |
| **Director graph 改动风险**（M5 + Classroom CW2 raise_hand 节点） | 🟡 | 🔴🔴🔴 | CW2 走独立 `ClassroomService.callRaiseHand()` 隔离；feature flag `classroom.enabled` 默认 ON 可关闭回退；CW2 上线前必须跑全量 Socratic e2e 回归 |
| **班主任/同学输出违规** | 🟡 | 🔴🔴 | 内容审核 + 关键词过滤 + 人工抽检 |
| **付费转化低** | 🟡 | 🔴🔴 | Freemium 调整 + 营销优化 |
| **PIPL 合规问题** | 🟢 | 🔴🔴🔴 | 强制 consent + 数据本地化 |
| **Electron 维护成本**（Phase 2.5+） | 🟡 | 🟡🟡 | 90% 代码共享 + 自动更新 |
| **Electron 代码签名延期** | 🟡 | 🟡 | 提前 2 月申请 EV 证书 |

---

## 15. 与其他 spec 的关系

| 文件 | 关系 |
|---|---|
| [shared-architecture.md](./shared-architecture.md) | 本方案是其 CN 实例化 |
| [cn-product.md](./cn-product.md) | 本方案是其 MVP 实施计划 |
| [intl-product.md](./intl-product.md) | 本方案与其独立，Phase 3 启动 INTL |
| [classroom-mode-design.md](./classroom-mode-design.md) | **V1 同步上**：CW1-CW5 与本方案 W1-W5 并行；7 个新 DSL action + RoundTable 外壳 + ClassroomService 隔离；INTL V1 兼容（i18n 文案 + 功能 100% 复用） |

---

## 16. 决策点确认

| # | 决策 | 选项 |
|---|---|---|
| 1 | **MVP 优先做 CN 伴读** | ✅ |
| 2 | **Web PWA + 不做微信小程序** | ✅ |
| 3 | **保留 2 同学 + 简化 DSL** | ✅ |
| 4 | **Freemium + ¥99/月 + 年付 ¥999** | ✅ |
| 5 | **7-9 周 MVP + 1-2 人 + ¥120-150 万** | ✅ |
| 6 | **MVP 不做 Electron** | ✅ |
| 7 | **Phase 2.5 按需求触发 Electron** | ✅（学校采购 / 离线需求 / ≥ 100 反馈） |
| 8 | **Electron 不做离线 AI** | ✅（云端大模型足够） |
| 9 | **Classroom Mode（C）V1 同步上**：CW1-CW5 与 W1-W5 并行；ClassroomService 隔离 raise_hand 不侵入 Director graph 主路径 | ✅（D-1 / D-2 / D-3 已决策） |

---

**下一步**：本方案 review 通过后，进入 **writing-plans** skill 拆任务清单（按周 + 按模块）。
