# OpenMAIC 伴学教室 · 设计 Spec

**Date**: 2026-08-25
**Status**: Draft · Pending review
**Author**: Brainstorm session

---

## 1. 概述

### 1.1 产品定位

把 OpenMAIC 从"AI 课堂生成器"演进为"课后伴学产品"。核心场景：中国双职工家庭，孩子放学回家后没人辅导作业，AI 老师 + AI 同伴陪伴学习，家长通过微信小程序接收每日报告。

### 1.2 目标用户

- **学生**：4-6 年级（10-12 岁），中国公立学校人教版/苏教版/北师大版
- **家长**：双职工，30-40 岁，微信重度用户，对辅导有焦虑但能力/时间有限
- **运营/教师（管理员）**：内容运营 + 学情分析师，PC Web 后台

### 1.3 核心痛点

| 角色 | 痛点 | 本产品解法 |
|---|---|---|
| 学生 | 课上听懂，作业不会；没人陪 | 苏格拉底式引导 + 同伴陪伴 |
| 家长 | 想辅导但不会 / 没时间；情绪化辅导 | AI 替辅导；微信日报告诉家长怎么接话 |
| 老师 | 班级 40-50 人，顾不过来 | 一对一定制化（间接，通过 AI 班主任模拟） |

### 1.4 市场决策

**双轨并行**：中国 MVP + Home School MVP 同步探索。

| 路线 | 市场 | 痛点 | 付费 | 集成 | 监管 | 工作量 |
|---|---|---|---|---|---|---|
| **中国 MVP** | 双职工家庭 | 强（不会教 + 没空） | $14-42/月 | 微信必选 | 模糊（双减） | 3-4 周 |
| **Home School MVP** ★ | 美/澳在家上学 | **更强**（家长不会 + 缺同伴 + 评估难，三痛并发） | **$20-80/月** | Email + Web push | **友好**（home school 合法） | 4 周 |
| 东南亚 | 华人圈 | 中 | 中 | 微信可用 | 中 | 后做 |
| 欧美本土 | 普通家庭 | 弱 | 高 | push + email | 严（COPPA/GDPR） | 最后 |

**为什么优先 Home School**：
1. **痛点更精准**：三痛并发 vs 中国一痛半
2. **监管最友好**：不需要"教学资质"，AI 辅导无监管风险
3. **付费强**：年 curriculum $500-3000 是常态
4. **集成简单**：少微信集成，少 1-2 周
5. **multi-agent 价值最大**：home school 缺同伴 = AI 同学直接解最大痛点
6. **可同步**：跟中国 MVP 共用 OpenMAIC multi-agent 基础，只换 UI/集成层

架构设计双轨：底层共用（multi-agent / director / agent registry / tts），上层分叉（中国 UI + 微信集成 vs Home School UI + 邮件集成）。

### 1.5 Home School 子市场（新增）

**目标用户**：美国 / 加拿大 / 澳大利亚 home school 家庭，孩子 K-5（5-10 岁）为主。

**3 种 home school 哲学**（按需支持）：
- **Charlotte Mason**（最大群体）：短课（20min）+ 自然学习 + 阅读为主
- **Classical / Traditional**：分年级 + 系统性 + 拉丁/古典
- **Eclectic / Unschooling**：家长自由组合

**教材支持**（v1）：
- **Common Core** 数学 + ELA（美国 K-5）
- **Singapore Math**（华人家长的最爱）
- **新加坡 UK 体系**（东南亚 + 部分美国 home school）

**评估合规**：
- 美国各州不同：TX/CA/FL 最宽松，PA/OH 要求标准化测试
- v1 不做评估自动化（避免监管复杂度），家长手动 record
- v2 接入 MAP / Iowa Test 准备（home school 常用）

**家长面板**（Web dashboard，非微信）：
- 每日 / 每周 / 每月 Email digest
- Portfolio 自动汇总（每周学生做了什么）
- 进度报告（按 Common Core 标准）
- 标准化测试准备度（MAP / SAT 自适应练习）

**角色命名**（避免"老师"，避免宗教暗示）：
- **导师**（mentor），不是 teacher
- **同学**（study buddy），不是 student peer
- 家长是 home school 的"主老师"，AI 是辅助

**同伴组**：跨 home school co-op 虚拟同伴（比如"纽约的 Emma" + "加州的 Noah"），更有真实感

**付费模型**：
- $19.99/月（单孩）
- $34.99/月（家庭 ≤3 孩）
- 年付 20% off（home school 家长偏好年付）

**获客渠道**：
- Facebook "homeschool mom" 群（最活跃）
- Instagram homeschool influencers（@raisinglifelonglearners 等）
- Home school conventions（Great Homeschool Convention 等）
- Well-Trained Mind / Simply Charlotte Mason 等内容合作

### 1.6 6 个设计 mockup

- `mockups/classroom-layout-c.html` — C1（聊天在底）
- `mockups/classroom-layout-c2.html` — C2（聊天在右下）
- `mockups/classroom-layout-c3.html` — **C3 定版**（浮气泡 + 紧凑输入条）
- `mockups/student-home.html` — 学生开始页 + 家长入口
- `mockups/admin-console.html` — 管理后台（含生成课程入口）
- `mockups/wechat-push.html` — 微信推送消息样式

---

## 2. 设计决策摘要

| 决策 | 选项 | 选择 | 理由 |
|---|---|---|---|
| 教室布局 | C1 / C2 / C3 | **C3 浮气泡 + 紧凑输入** | 真教室"贴"着人聊，不集中消息流 |
| "真人"实现 | 单老师 / 单老师+多同伴 / 三位一体 | **老师+2同伴+家长助手** | 差异化最强，multi-agent 已有基础 |
| MVP 范围 | A:1-2周 / B:3-4周 / C:8-12周 | **B 核心 MVP** | 错题闭环 + 同伴感 + 家长日报都有 |
| 学生入口 | 找课程 / 继续上次 | **继续上次（hero CTA）** | 零思考进入 |
| 聊天位置 | 底部 / 右下 / 浮气泡 | **浮气泡 + 完整历史抽屉** | 真教室感最强 |
| 家长通道 | Web / 小程序 / 公众号 | **微信小程序 + 长期订阅** | 不装 APP，合规清晰，推送稳定 |
| 推送频率 | 每天 / 每周 | **每周 1-3 次（家长可设）** | 防骚扰 + 家长不疲劳 |
| 数据存储 | 纯 client IndexedDB / 跨设备 | **服务端 PostgreSQL + 缓存** | 跨设备同步；家长看到的是同一份数据 |

---

## 3. 架构

### 3.1 模块图

```
┌─────────────────────────────────────────────────────────────────┐
│                       学生侧 App (Next.js PWA)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ 教室 (C3)    │  │ 学生首页     │  │ 错题本       │            │
│  │ (黑板+课桌  │  │ (Hero CTA +  │  │ (列表+艾宾   │            │
│  │ +浮气泡)    │  │ 今日任务)    │  │ 浩斯复习)    │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ 状态层（Zustand）                                     │       │
│  │  • stage store (OpenMAIC 现有)                       │       │
│  │  • companion store (新增：伴学角色状态)              │       │
│  │  • mistake book store (新增：错题+错因)              │       │
│  │  • knowledge graph store (新增：知识点熟练度)        │       │
│  │  • emotion history store (新增：情绪历史)             │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / SSE
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  OpenMAIC Server (Next.js API + workers)        │
│                                                                  │
│  ┌─ 现有模块 ──────────────────┐  ┌─ 新增模块 ─────────────┐    │
│  │ • outline / scene 生成      │  │ • 伴学 director        │    │
│  │ • chat runtime               │  │ • 错题归因引擎         │    │
│  │ • agent registry             │  │ • 知识图谱服务         │    │
│  │ • tts / voice                │  │ • 微信桥接 (wechat-bridge)│ │
│  │ • document store             │  │ • 推送定时任务          │    │
│  └──────────────────────────────┘  │ • 家长小程序 API       │    │
│                                    └─────────────────────────┘    │
│                                                                  │
│  ┌─ LLM Providers ──────────────────────────────────────┐      │
│  │ MiniMax (M3 + M2.7) · 已配置 ✓                        │      │
│  │ MiniMax TTS / Image / Video / Web Search · 已配置 ✓   │      │
│  │ 备用：OpenAI / Anthropic / Qwen / 豆包（家长可选）   │      │
│  └────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 调微信 API
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  微信小程序 (家长侧)                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ • 订阅授权 (wx.requestSubscribeMessage)               │    │
│  │ • 学习日报 (今日时长/错题/弱项/情绪/老师金句)         │    │
│  │ • 错题本查看                                             │    │
│  │ • 学情图谱 (各科知识点雷达)                             │    │
│  │ • 推送设置 (频率/时间/类型)                             │    │
│  │ • 留言给小诺姐姐 (双向)                                │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  管理后台 (PC Web · Next.js)                    │
│  仪表盘 / 学生管理 / 内容生成 / 教材 / AI角色库 / 错题库 / 推送│
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 持久化

**服务端权威数据**（PostgreSQL）：

```sql
-- 学生档案
students (id, name, grade, textbook_version, created_at, settings_json)

-- AI 角色（班主任 + 同伴固定配置）
ai_personas (id, student_id, role, name, persona, voice_config, avatar_path, color)

-- 错题本
mistakes (id, student_id, question_text, question_image_url, user_answer,
          correct_answer, error_reason, knowledge_point_id, mastered_at)

-- 知识点图谱
knowledge_points (id, subject, grade, textbook_version, name, parent_id)
student_knowledge (student_id, knowledge_point_id, mastery_score, updated_at)

-- 情绪历史
emotion_logs (id, student_id, session_id, detected_emotion, confidence, context)

-- 推送订阅
push_subscriptions (id, parent_id, student_id, template_id, frequency, time, enabled)

-- 家长身份
parents (id, wechat_openid, phone, students jsonb)
```

**客户端缓存**（IndexedDB，OpenMAIC 现有）：
- 短期离线浏览用
- 长期数据权威在服务端

### 3.3 数据流：典型伴学回合

```
学生进教室（首页 hero CTA "继续"）
   ↓
服务端：load student state（角色 + 进度 + 错题本）
   ↓
客户端：渲染教室（C3 浮气泡 + 紧凑输入）
   ↓
学生打字提问 / 举手
   ↓
服务端：director 选择 next_agent
   - 默认 student_message → teacher
   - teacher 在白板手写 + speech
   - director 决定是否让同伴插嘴
   ↓
客户端：流式渲染（speech + 白板手写 + 浮气泡）
   ↓
学生答题 → 提交
   ↓
服务端：判分 → 错题入本 → 更新知识图谱 → 情绪检测
   ↓
客户端：庆祝动画 / 错题反馈
   ↓
晚上 21:00 定时任务：聚合日报 → 微信推送
   ↓
家长收到推送 → 点开看日报 → 留言给小诺姐姐
   ↓
服务端：留言 → 转 AI 处理 → 第二天老师引用
```

---

## 4. 功能模块

### 4.1 角色与记忆（companion module）

**班主任（固定 1 个）**

- **Onboarding**：根据孩子性格选预设模板（温柔姐姐 / 严格老师 / 搞笑大叔）
- **长期记忆**：
  - 孩子基本信息（年级 / 兴趣 / 性格 / 最近学校的事）
  - 错题本 + 错因
  - 知识点掌握度
  - 情绪历史 + 关键发言引用
- **苏格拉底引导**：不直接给答案，prompt 模板：
  ```
  你是一个温柔的小学老师。你的学生会问你作业题。
  严格遵守：
  1. 不直接给答案
  2. 先问"你怎么想的？"
  3. 必要时给提示（一句话）
  4. 学生实在不会，分步拆解思路
  5. 学生错了不批评，反问"为什么这么算？"
  6. 学生对了简单肯定，然后追问"如果分母不同呢？"
  7. 情绪检测：连续 2 题错就切换到鼓励语气
  ```

**同伴（固定 2-3 个）**

- 预设：小红（爱问）/ 小亮（粗心）/ 阿泽（细心）
- 性格固定，**但会"成长"**——根据孩子反馈调整互动方式
- 同伴发言触发：director 在 teacher 说完后概率让同伴插嘴（whisper 给同学 / 反驳 / 补充）
- **whisper 视觉**：浮气泡 + 虚线连接（不集中在右下）

**家长助手（独立通道）**

- 单独的 system prompt
- 不在 chat 里发言
- 给家长讲错题怎么讲 + 心理侧建议
- 在家长小程序里以"小助理"身份回复

### 4.2 作业模式（核心）

**学生入口**：
- 拍照（OCR + LLM 解析） / 打字输入题目
- 选错题本里旧的题
- 直接念题（语音输入）

**AI 引导流程**：
1. 学生提问
2. AI 不直接答："你怎么想的？"
3. 学生答
4. 答对 → 肯定 + 追问（举一反三）
5. 答错 → 反问"为什么这么算？" → 学生解释 → 指出错误思路 → 引导正确思路
6. 实在不会 → 分步拆解思路（3-5 步）
7. 完成后 → 自动入错题本（标注错因）
8. 错因分类：分母通分错 / 计算粗心 / 概念混淆 / 单位换算错 / 题意不理解

**错题归因引擎**（新增模块）：
- 学生答错后 + 学生解释的思路 → LLM 推断错因
- 错因 5 类标签 + 详细文字说明
- 同一错因的题 → 复习时按错因聚合

### 4.3 复习模式（艾宾浩斯）

**算法**：
- 错题入本时：标记熟练度 0%
- 复习完成（答对）：熟练度 +20%，下次复习间隔按艾宾浩斯延长
- 复习答错：熟练度 -10%，下次复习间隔缩短
- 熟练度 100% + 3 次答对 → 出错题本

**每日复习队列**：
- 每天首页 "📕 今日复习" 显示 3-5 道待复习题
- 按"应该复习时间"排序（最久的优先）
- 复习模式 UI：单题循环，不显示完整错题本（避免选择困难）

### 4.4 番茄钟模式

- 25min 学习 + 5min 休息
- 班主任期间主动关心（"已经 20 分钟了，要不要休息？"）
- 家长可设上限（默认 25min/天）
- 超时：弹"今天够了，明天继续？"提示

### 4.5 朗读评测（v2 范围）

- 英语单词 / 语文课文跟读
- 语音评测：发音准确度 + 流利度
- 跟 OpenMAIC 现有 TTS 集成（学生发音 → TTS 对比）

### 4.6 知识点图谱

**schema**：
```ts
interface KnowledgePoint {
  id: string;       // e.g. "math.4.fraction.adding.different-denominator"
  subject: string;  // "math" | "chinese" | "english"
  grade: number;
  textbookVersion: string;
  name: string;
  parent: string | null;  // 树形结构
}

interface StudentKnowledge {
  studentId: string;
  knowledgePointId: string;
  masteryScore: number;  // 0-100
  lastUpdatedAt: number;
  evidenceCount: number;
}
```

**更新规则**：
- 学生答对相关题：mastery +5
- 学生答错相关题：mastery -10
- 错题归因为"概念混淆"：直接 -20 + 标记弱项

**展示**：
- 学生侧：首页"学情"卡片按章节粒度展示（粗）
- 家长侧：小程序"学情图谱"展示细到具体概念

### 4.7 教室 C3 布局（详细）

```
┌────────────────────────────────────────────────────────┐
│ Header: ☰ 老师pill  模式tabs  🍅番茄  💬聊天抽屉(3)  │
├──────────────────────────┬─────────────────────────────┤
│ 教室（占满左半）          │ 作业（按模式切换）           │
│                          │                             │
│ ┌─ 黑板（手写动画）──┐  │ ┌─ 当前题目 ──────────┐    │
│ │ 异分母分数加法      │  │ │ 1/2 + 1/3 = ?      │    │
│ │ ① 先找公分母        │  │ │ 答案: [___]  [提交]│    │
│ │ ② 转化              │  │ │ [✋需要帮助] [💡]  │    │
│ └─────────────────────┘  │ └─────────────────────┘    │
│                          │                             │
│ 👩‍🏫小诺 (讲台+🎤)      │ ┌─ 📕 今日错题 ───────┐    │
│ 💬浮气泡"小红举手了"   │ │ • 1/4+1/6 ✗ 分母错 │    │
│                          │ │ • 2/3+1/4 ✗ 粗心   │    │
│ ┌─ 4 张课桌 ──────────┐  │ │ • 5/6-1/3 ⏱ 待复习 │    │
│ │ 小红✋  小亮💭      │  │ └─────────────────────┘    │
│ │ (浮气泡)(浮气泡)  │  │                             │
│ │ 阿泽💭  📷你       │  │                             │
│ └─────────────────────┘  │                             │
│ ╭─ ─ ─ ─ whisper ─ ─╮  │                             │
│                          │                             │
├──────────────────────────┴─────────────────────────────┤
│ 输入条: 📷 [输入... ✋举手后被叫到才能发言] 🎤 😊 ✋  │
└────────────────────────────────────────────────────────┘
```

**关键设计点**：

1. **浮气泡**：每个角色的话"贴"在头像旁，不集中在底部
2. **whisper 虚线**：小红↔小亮小声讨论时画虚线连接
3. **思考气泡**：阿泽 💭 用淡色 italic
4. **输入条固定底部**：64px 永远可见
5. **聊天抽屉右上角**：💬 带未读 badge (3)，点击展开完整历史
6. **黑板手写动画**：speech 触发白板逐字出现 + 闪烁光标

### 4.8 模式切换（作业 / 复习 / 自由）

**作业模式**（默认）：右半屏显示当前题目 + 错题本
**复习模式**：右半屏显示艾宾浩斯复习队列（错题循环），无新错题入本
**自由模式**：右半屏空白或聊天抽屉展开，纯聊天陪伴

### 4.9 家长小程序 + 推送

**小程序功能**：
- 学习日报（今日时长 / 错题 / 弱项 / 情绪 / 老师金句）
- 错题本查看（家长看孩子的错题，建议怎么辅导）
- 学情图谱（按章节 / 知识点）
- 推送设置（频率 / 时间 / 类型）
- 留言给小诺姐姐（双向 → 转 AI 处理）

**推送模板**（订阅消息）：
```
📊 小明今日学习报告
⏱️ 23分钟  ✅ 8题  ❌ 3题
⚠️ 异分母分数仍是弱项（30%）
💬 "为什么要找公分母？" — 他终于懂了
💡 家长可以这样辅导：今晚吃饭时随口问问...
                  [查看完整报告 →]
```

**频率策略**：
- 默认：每周一三五 21:00
- 家长可改：每天 / 每周 / 不推送
- 紧急通知例外（情绪低落 / 反复错）→ 即时推

### 4.10 管理后台

**导航分组**：
- 概览（仪表盘 / 待处理）
- 学生（管理 / 学情 / 家长反馈）
- 内容（生成课程 / 教材 / AI角色库 / 错题库）
- 运营（推送 / 设置）

**生成课程**（复用 OpenMAIC 现有 outline + scene-content 流程）：
- 字段：内容类型 / 教材版本 / 年级 / 需求描述 / 关联 AI 角色 / 推送给谁
- 一键生成 → 推送给选中的学生群

---

## 5. 错误处理

| 场景 | 处理 |
|---|---|
| LLM 响应超时 | 重试 1 次 + 显示"老师在思考..."占位 + 兜底文案 |
| LLM 输出 type 错误（已知问题） | 已加 storage sanitize 兜底（commit 423b86b1） |
| 微信 access_token 过期 | 缓存 7200s，过期前 5min 刷新；失败重试 1 次 |
| 家长退订 | 推送订阅表标记 enabled=false，不推送但保留数据 |
| 学生拍照 OCR 失败 | 提示重新拍，建议光线 + 角度 |
| 语音评测引擎超时 | 用纯流利度维度评估，跳过发音细节 |
| 错题归因 LLM 返回不确定 | 标记"待人工确认"，先归"其他" |
| 推送发送失败 | 重试 3 次（指数退避）；失败记日志，家长下次手动拉取 |
| 知识点不存在于图谱 | LLM 推断后新建（运营审核） |
| 多个学生同时在线 director 抢答 | LangGraph state 隔离，按 sessionId |

---

## 6. 测试 / 验收标准

### 6.1 单元测试

- 错题归因引擎（5 类错因分类准确率 ≥ 85%）
- 艾宾浩斯复习算法（间隔时间正确）
- 知识点 mastery 更新规则
- storage sanitize（已知 commit 423b86b1）

### 6.2 集成测试

- director graph：单回合选 next_agent 正确
- 多 agent 并发：teacher + 同伴接力
- 微信推送：模板渲染 + access_token 缓存 + 失败重试

### 6.3 E2E（Playwright）

- 学生进首页 → 点 hero CTA → 进教室 → 问老师 → 收到引导 → 提交答案 → 错题入本
- 家长进小程序 → 看日报 → 留言 → 第二天老师引用
- 管理员生成课程 → 推送给指定学生群 → 学生收到推送

### 6.4 验收标准（业务）

| 指标 | 目标 |
|---|---|
| 学生留存（7 天） | ≥ 40% |
| 学生日均使用时长 | 15-25 min |
| 家长日报打开率 | ≥ 60% |
| 错题复习完成率（被推的题中） | ≥ 50% |
| 知识图谱自动归因准确率 | ≥ 85% |
| 推送送达率 | ≥ 95% |
| LLM 响应延迟（端到端） | p95 ≤ 8s |

---

## 7. 工作量分阶段

### Phase 0: 已完成（OpenMAIC 现有）
- multi-agent 生成 / chat runtime / agent registry / tts / voice / document store
- 课程播放 layout（SceneSidebar / CanvasArea / ChatArea / Roundtable）

### Phase 1: MVP（3-4 周，2 人）★ 推荐先做

| 模块 | 工作量 | 人员 |
|---|---|---|
| 学生档案 + onboarding（年级 / 教材 / 角色预设） | 3 天 | 全栈 |
| 错题本 + 归因引擎 | 1 周 | 全栈 |
| 班主任角色系统 + 苏格拉底 prompt | 4 天 | AI |
| 同伴角色系统（2 个）+ whisper 视觉 | 5 天 | 全栈 + AI |
| 番茄钟模式 | 2 天 | 全栈 |
| 复习模式（艾宾浩斯） | 4 天 | 全栈 |
| 知识点图谱（粗粒度） | 3 天 | AI + 后端 |
| 家长日报文本生成（先不发微信，落到管理后台） | 3 天 | AI + 后端 |
| 教室布局改造（C3 浮气泡） | 1 周 | 前端 |
| 存储边界 sanitize（已完成 commit 423b86b1） | ✓ | — |

### Phase 2: 微信集成 + 管理后台（2-3 周）

| 模块 | 工作量 |
|---|---|
| 微信小程序家长侧（订阅授权 + 日报 + 错题本 + 推送设置） | 1.5 周 |
| 服务端 wechat-bridge 模块（access_token 缓存 + 模板发送） | 4 天 |
| 定时任务（每日 21:00 推送） | 3 天 |
| 管理后台（仪表盘 + 学生列表 + 生成课程入口） | 1 周 |
| 推送设置 + 紧急通知逻辑 | 3 天 |

### Phase 3: 完整版（3-4 周）

| 模块 | 工作量 |
|---|---|
| 教材同步（人教 / 苏教 / 北师大，按目录走） | 1.5 周 |
| 朗读评测（英语发音 / 流利度） | 1 周 |
| 情绪检测（挫败 / 走神 / 开心，强度判定） | 1 周 |
| 知识点图谱细粒度（到具体概念） | 1 周 |
| 班主任人格成长（孩子反馈后角色进化） | 1 周 |
| 心理侧建议（家长助手升级） | 3 天 |

### Phase 4: 出海（按需启动）

- 东南亚：抽象推送层 → WhatsApp / Telegram / LINE；教材加新加坡 UK 体系
- 欧美：GDPR / COPPA / FERPA 合规；Common Core / IB 教材；Stripe 支付

### Phase 1': Home School MVP（4 周，2 人）★ 跟 Phase 1 并行

**复用 Phase 1 后端基础**，差异化在 UI + 集成 + 内容：

| 模块 | 工作量 | 差异化 |
|---|---|---|
| 学生档案 + onboarding（年级 / 哲学 / 教材版本） | 3 天 | 哲学选 Charlotte Mason / Classical / Eclectic |
| 错题本 + 归因引擎 | **复用 Phase 1** | — |
| AI mentor 角色系统 + Socratic prompt | 4 天 | mentor 定位（不是 teacher）；20min 短课模式 |
| 跨 home school co-op 虚拟同伴（Emma + Noah） | 5 天 | "纽约 Emma" / "加州 Noah" 地域感 |
| Portfolio 自动汇总（每周） | 3 天 | home school 重视的 record keeping |
| Common Core 进度报告（按章节） | 4 天 | 替代知识图谱，更标准化 |
| 番茄钟（20min，Charlotte Mason 风格） | 2 天 | 短课而非 25min |
| Email digest（每日 / 每周 / 每月可设） | 3 天 | 替代微信推送 |
| 家长 Web dashboard | 5 天 | 替代家长小程序 |
| 教室布局改造（C3 同 + mentor 定位调整） | 3 天 | "导师" 而非 "班主任" |
| Stripe 支付集成 | 3 天 | 微信支付 → Stripe |
| 3 个 mockup（home school 学生首页 / mentor classroom / parent web dashboard） | 2 天 | — |

**关键差异化**：
- **角色命名**：mentor / study buddy（不是 teacher / student peer）
- **同伴地理感**：跨 home school co-op（"Emma 在纽约"），更真实社交
- **家长 dashboard**（不是小程序）：Web 端，桌面友好
- **Email digest**（不是微信推送）：频率可设，默认周报
- **Charlotte Mason 短课**：默认 20min 而非 25min
- **Portfolio 记录**：每周自动汇总（home school 重视的 record）
- **付费**：$19.99/月 / $34.99/月家庭套餐 / 年付 20% off

**获客首批 50 家庭**：
- Facebook "homeschool mom" 群发帖（15 个群）
- Instagram @raisinglifelonglearners / @simply.charlotte.mason 等 homeschool influencers 合作
- Great Homeschool Convention（线下 booth）
- 提供 30 天免费试用

**验证指标**（区别中国版）：
- 学生留存 14 天 ≥ 50%（home school 家长更稳定）
- 家长 NPS ≥ 40
- Portfolio 自动汇总采用率 ≥ 70%
- 同伴互动频率（每周同伴相关 turn 数）≥ 20
- 付费转化（试用 → 付费）≥ 25%

---

## 8. 风险与依赖

| 风险 | 影响 | 缓解 |
|---|---|---|
| 微信长期订阅申请被拒 | Phase 2 延期 | 备选：公众号模板消息（次优但稳） |
| LLM 苏格拉底引导效果不稳定 | 核心体验差 | prompt 多次迭代 + few-shot examples + 人工评测 |
| 错题归因准确率不达标 | 家长报告不准 | 启动时标注"AI 推断"，家长可手动修正 |
| 端到端延迟过高 | 学生等待不耐烦 | 流式 + 占位动画 + 番茄钟自然缓冲 |
| 知识图谱维护成本 | 运营负担 | 启动时按章节粗粒度，先不做到概念 |
| 国内政策变化（双减 / AI 监管） | 产品合规 | 保持"AI 辅导"而非"AI 教学"定位 |

### 外部依赖

- **微信小程序 appid / secret / 长期订阅 template_id**（需要申请 + 审批）
- **MiniMax API key**（已配置，备用 OpenAI / Anthropic）
- **TTS / Image / Video providers**（已配 MiniMax）
- **PostgreSQL**（生产部署需要，本地开发可先用 SQLite）

---

## 9. 出海钩子（架构层预留）

为了让 Phase 4 出海时改动最小：

1. **推送层抽象**：`interface NotificationChannel { send(template, payload) }`
   - 实现：WeChatChannel / EmailChannel / PushChannel / WhatsAppChannel
2. **教材版本抽象**：`interface TextbookAdapter { chapters(grade, subject) }`
   - 实现：PeopleEdAdapter / SuJiaoAdapter / BNUPAdapter / SingaporeUKAdapter
3. **多语言抽象**：所有用户文案走 i18n（OpenMAIC 已有 i18n 基础设施）
4. **合规层**：`interface ComplianceGuard { checkStudent(age, region) }`
   - 实现：ChinaCompliance / GDPRCompliance / COPPACompliance

---

## 10. 后续步骤

- [ ] **User review**：本文档 → 用户审阅
- [ ] **Plan writing**：调用 `writing-plans` skill，按 Phase 1 拆任务
- [ ] **Implementation**：MVP 按 Phase 1 推进
- [ ] **Iterate**：根据种子用户反馈调整

---

## 附录：mockup 文件清单

| 文件 | 用途 |
|---|---|
| `mockups/classroom-layout-c.html` | 教室布局 C1（已弃） |
| `mockups/classroom-layout-c2.html` | 教室布局 C2（已弃） |
| `mockups/classroom-layout-c3.html` | **教室布局 C3（定版）** |
| `mockups/student-home.html` | 学生侧首页 + 家长侧入口 |
| `mockups/admin-console.html` | 管理后台 |
| `mockups/wechat-push.html` | 微信推送消息样式 |
