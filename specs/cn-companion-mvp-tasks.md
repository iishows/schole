# CN 伴读 MVP · 任务清单（writing-plans）

**Date**: 2026-08-25
**Status**: Draft · Pending review
**对应 MVP**：[cn-companion-mvp-plan.md](./cn-companion-mvp-plan.md)
**核心价值**：[core-value.md](./core-value.md)

> **本文档是 MVP 的可执行任务清单**——按 13 个核心模块拆解，每个 task 含依赖、产出、工作量。按 7-9 周排期（W1-W9）。

---

## 0. 总览

### 0.1 模块清单

| # | 模块 | 工作量 | 依赖 | Week |
|---|---|---|---|---|
| **M0** | 资质申请（并行启动）| 1-3 月 | 无 | W1 启动 |
| **M1** | Web PWA 壳 | 3 天 | 无 | W1 |
| **M2** | 用户系统（手机号 + 微信）| 3 天 | M1 | W1 |
| **M3** | 小诺姐姐 persona + Socratic prompt | 3 天 | 无 | W1 |
| **M4** | 小红 + 阿泽 persona | 4 天 | M3 | W2 |
| **M5** | Director graph 多轮 multi-agent 扩展 | 1 周 | M3, M4 | W2-W3 |
| **M6** | 错题本（手动 + 拍照 OCR）| 4 天 | M2, M5 | W3-W4 |
| **M7** | Socratic 对话 UI | 3 天 | M5, M6 | W4 |
| **M8** | 简化 DSL + 简化 Whiteboard | 4 天 | M5 | W5 |
| **M9** | 间隔重复调度 | 2 天 | M6 | W5 |
| **M10** | 学习报告 + 公众号周报 | 3 天 | M6, M9 | W6 |
| **M11** | 微信支付 + ¥99/月 | 4 天 | M2 | W6 |
| **M12** | PIPL consent + ICP + 内容审核 | 3 天 | M2 | W7 |
| **M13** | 阿里云部署（cn-region + ACK）| 3 天 | M11, M12 | W7 |
| **M14** | 端到端测试 + Bug 修复 | 1 周 | M1-M13 | W8 |
| **M15** | 灰度 + 正式上线 | 3 天 | M14 | W9 |
| **CM1** | **Classroom · Period Bar + 铃（CW1 并行）** | 3 天 | 无 | CW1（与 W1 并行）|
| **CM2** | **Classroom · 举手 + `raise_hand`（CW2 并行）** | 3 天 | M3, CM1 | CW2（与 W2 并行）|
| **CM3** | **Classroom · 叫答 + `call_on`（CW3 并行）** | 3 天 | CM2 | CW3（与 W3 并行）|
| **CM4** | **Classroom · 同桌 + `pass_note` + seatLayout（CW4 并行）** | 3 天 | CM2 | CW4（与 W4 并行）|
| **CM5** | **Classroom · 黑板 + `blackboard_annotate`（CW5 并行）** | 3 天 | 无 | CW5（与 W5 并行）|
| **总计（含 C）** | — | **5 周** | — | — |

> **CW1-CW5 与 W1-W5 并行**，不延长 timeline。详见 [`classroom-mode-design.md §6`](./classroom-mode-design.md#6-5-周增量实施)。

### 0.2 周排期总览

```
W1: M1（Web PWA 壳）+ M2（用户）+ M3（小诺姐姐）         ⫻ CW1 · CM1（Period 容器）
W2: M4（同学）+ M5（Director 启动）                       ⫻ CW2 · CM2（举手 + raise_hand · ClassroomService 隔离）
W3: M5（Director 继续）+ M6（错题本启动）                  ⫻ CW3 · CM3（叫答 + call_on）
W4: M6（OCR）+ M7（Socratic 对话 UI）                       ⫻ CW4 · CM4（同桌 + pass_note + seatLayout）
W5: M8（DSL + Whiteboard）+ M9（间隔重复）                  ⫻ CW5 · CM5（黑板 + blackboard_annotate）
W6: M10（公众号周报）+ M11（微信支付）
W7: M12（PIPL + 内容审核）+ M13（部署）
W8: M14（端到端测试）
W9: M15（灰度 + 正式上线）
```

**CM1-CM5 全部并行**（D-1 决策）：CM2 走独立 `ClassroomService.callRaiseHand()`，不侵入 Director graph 主路径；所有 7 个新 DSL action 增量加入 action schema validator；CM4 seatLayout 默认 `ClassroomLayoutService.autoGenerate()`。

### 0.3 团队配置

| 角色 | 人数 | 月薪 | 职责 |
|---|---|---|---|
| **工程师 A**（全栈）| 1 | ¥5 万 | 前端 + 后端 + 部署 + DevOps |
| **工程师 B**（内容）| 0.5 | ¥3 万 | 班主任/同学人设 + Socratic prompt + 双减边界 |
| **设计 C**（外包）| 0.5 | ¥1.5 万 | UI + PWA 图标 + 公众号模板 |

---

## M0 · 资质申请（W1 启动，与 MVP 并行）

### M0.1 任务列表

| # | 任务 | 责任 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|---|
| M0.1.1 | 微信小程序 appid 申请（暂不用，先备）| 工程师 A | 1-2 周 | 公司主体 | appid |
| M0.1.2 | **微信公众号模板消息资质** | 工程师 A | **1-3 月** | 公司主体 + 教育类目 | 模板消息 ID |
| M0.1.3 | **微信支付商户号申请** | 工程师 A | **1-2 月** | 营业执照 | 商户号 |
| M0.1.4 | ICP 备案 | 工程师 A | 1-2 周 | 阿里云 | 备案号 |
| M0.1.5 | 微信公众号认证（年费 ¥300）| 工程师 A | 1 周 | 公司主体 | 认证 |
| M0.1.6 | 法务咨询（PIPL + 双减边界）| 法务顾问 | 1 周 | — | 法律意见书 |

### M0.2 风险与缓解

| 风险 | 概率 | 缓解 |
|---|---|---|
| 微信支付商户号 2 月未到 | 🟡 | MVP 临时用 Stripe + Email 推送 |
| 公众号模板消息资质 3 月未到 | 🟡 | MVP 临时用 Email digest |
| ICP 备案驳回 | 🟢 | 阿里云协助 |

---

## M1 · Web PWA 壳（W1 D1-D3）

### M1.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| M1.1.1 | Next.js 16 项目初始化（monorepo apps/cn/）| 0.5 天 | 无 | Next.js 骨架 |
| M1.1.2 | Tailwind v4 + 基础布局（移动 + 桌面响应式）| 1 天 | M1.1.1 | 全局 layout |
| M1.1.3 | **manifest.json**（PWA 配置：图标/名称/主题色）| 0.5 天 | M1.1.1 | PWA manifest |
| M1.1.4 | **service worker**（离线缓存 + 添加到主屏幕）| 1 天 | M1.1.1 | service worker |
| M1.1.5 | HTTPS 配置（阿里云 SSL）| 0.5 天 | M0.1.4 | HTTPS 可用 |
| M1.1.6 | PWA 安装提示 UI（"添加到主屏幕"）| 0.5 天 | M1.1.3 | 提示组件 |

### M1.2 验收标准

- [ ] 浏览器打开 `openmaic.app` 显示页面
- [ ] Chrome 提示"安装 PWA"
- [ ] 安装后桌面有图标，点击全屏打开
- [ ] iOS Safari 可"添加到主屏幕"
- [ ] 移动 + 桌面响应式正常

---

## M2 · 用户系统（W1 D4-D6 / W2）

### M2.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| M2.1.1 | PostgreSQL users 表 + 索引（已有则复用）| 0.5 天 | 无 | schema |
| M2.1.2 | 手机号 + 验证码登录（阿里云短信）| 1.5 天 | M2.1.1 | 登录接口 |
| M2.1.3 | 微信扫码登录（OAuth 流程）| 1 天 | M0.1.5 | 微信登录 |
| M2.1.4 | 用户信息接口（GET / PATCH）| 0.5 天 | M2.1.2 | 用户 API |
| M2.1.5 | 退出登录 + token 刷新 | 0.5 天 | M2.1.2 | auth API |

### M2.2 验收标准

- [ ] 手机号 + 验证码登录成功
- [ ] 微信扫码登录成功（资质下来后）
- [ ] 用户信息持久化
- [ ] token 验证中间件

---

## M3 · 小诺姐姐 persona（W1 D7-D9）

### M3.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| M3.1.1 | persona schema 定义（id/name/role/persona/voiceConfig）| 0.5 天 | 无 | TS interface |
| M3.1.2 | 小诺姐姐 persona 文本（中文 Socratic + 8 条规则）| 1 天 | 无 | prompt 草稿 |
| M3.1.3 | persona DB schema + API CRUD | 1 天 | M2 | persona API |
| M3.1.4 | MiniMax TTS 配置（female-warm / zh-CN）| 0.5 天 | 无 | TTS 可用 |
| M3.1.5 | 小诺姐姐头像资源（设计 C 准备）| 0.5 天 | — | avatar.png |

### M3.2 验收标准

- [ ] 小诺姐姐 persona 文本包含 8 条 Socratic 规则
- [ ] TTS 输出小诺姐姐声音正常
- [ ] 头像在 UI 中显示正常

---

## M4 · 小红 + 阿泽 persona（W2 D1-D4）

### M4.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| M4.1.1 | 小红 persona（爱提问女生，故意问"为什么"）| 1.5 天 | M3 | persona + prompt |
| M4.1.2 | 阿泽 persona（粗心男生，故意犯同样错）| 1.5 天 | M3 | persona + prompt |
| M4.1.3 | 同学头像资源（设计 C 准备）| 0.5 天 | — | 2 张头像 |
| M4.1.4 | TTS 多角色配置（小红 girl-curious + 阿泽 boy-careless）| 0.5 天 | M3.1.4 | TTS 多角色 |

### M4.2 验收标准

- [ ] 小红 prompt 包含"每 3 轮 mentor 后问 1 个为什么"
- [ ] 阿泽 prompt 包含"每 5 轮 mentor 后故意答错 1 次"
- [ ] 3 个角色 TTS 声音区分明显

---

## M5 · Director graph 多轮 multi-agent 扩展（W2 D5 - W3 D5）

### M5.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| M5.1.1 | 复用 LangGraph StateGraph | 0.5 天 | M3, M4 | graph 配置 |
| M5.1.2 | 定义 multi-turn 状态（messages + turnCount + currentSpeaker）| 1 天 | M5.1.1 | State annotation |
| M5.1.3 | mentor node（Socratic prompt + LLM 调用）| 1 天 | M3.1.2 | mentor node |
| M5.1.4 | buddy_hong node（小红故意提问）| 0.5 天 | M4.1.1 | hong node |
| M5.1.5 | buddy_aze node（阿泽故意犯错）| 0.5 天 | M4.1.2 | aze node |
| M5.1.6 | 轮转逻辑（mentor → buddy → mentor → buddy → mentor）| 1 天 | M5.1.3-5 | turn logic |
| M5.1.7 | 终止条件（孩子回答正确 OR 达到最大轮数）| 0.5 天 | M5.1.6 | termination |
| M5.1.8 | **端到端测试**：跑通 1/2 + 1/3 错题完整流程 | 1 天 | M5.1.7 | 测试报告 |

### M5.2 验收标准（核心）

- [ ] mentor → buddy_hong → mentor → buddy_aze → mentor 轮转正常
- [ ] 小红每 3 轮插入提问
- [ ] 阿泽每 5 轮故意答错
- [ ] 孩子回答正确 → 终止
- [ ] 错误答案继续 Socratic 引导

### M5.3 关键技术点

- 复用 `lib/orchestration/director-graph.ts` + `lib/agent/runtime/build-agent.ts`
- 添加 multi-turn StateGraph 配置
- 关键是触发节奏（小红 3 轮、阿泽 5 轮）

---

## M6 · 错题本（手动 + 拍照 OCR）（W3 D6 - W4 D5）

### M6.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| M6.1.1 | PostgreSQL mistakes 表 + 索引 | 0.5 天 | M2 | schema |
| M6.1.2 | spaced_repetition_queue 表 | 0.5 天 | M6.1.1 | schema |
| M6.1.3 | 错题 CRUD API（POST/GET/PATCH/DELETE）| 1 天 | M6.1.1 | mistake API |
| M6.1.4 | 错题列表 UI（按章节/状态过滤）| 1 天 | M6.1.3 | 列表页 |
| M6.1.5 | 拍照上传（前端 + 阿里云 OSS）| 0.5 天 | M6.1.1 | upload UI |
| M6.1.6 | **OCR 集成（MiniMax multimodal vision）**| 1 天 | M6.1.5 | OCR API |
| M6.1.7 | 手动添加错题（用户填写答案 + 章节）| 0.5 天 | M6.1.3 | 手动添加 |
| M6.1.8 | 错题详情页（关联 Socratic 对话入口）| 0.5 天 | M6.1.3 | 详情页 |

### M6.2 验收标准

- [ ] 手动添加错题成功入库
- [ ] 拍照 OCR 识别错题（准确率 ≥ 70%）
- [ ] 错题列表按章节/状态过滤
- [ ] 错题详情可点击进入 Socratic 对话

---

## M7 · Socratic 对话 UI（W4 D6-D8）

### M7.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| M7.1.1 | 对话消息流组件（mentor/buddy/孩子气泡）| 1 天 | M5 | chat UI |
| M7.1.2 | 角色头像 + 颜色（紫/红/橙）| 0.5 天 | M5 | avatar 显示 |
| M7.1.3 | SSE 流式对话（POST /api/chat/message）| 1 天 | M5 | SSE endpoint |
| M7.1.4 | 输入框 + 发送（孩子打字）| 0.5 天 | M7.1.1 | input UI |
| M7.1.5 | 加载状态 + 打字动画 | 0.5 天 | M7.1.1 | loading UI |

### M7.2 验收标准

- [ ] 孩子看到 3 个角色头像
- [ ] mentor / buddy 消息按顺序显示
- [ ] 孩子输入答案 → 流式返回 mentor 引导
- [ ] 打字时有 loading 动画

---

## M8 · 简化 DSL + 简化 Whiteboard（W5 D1-D4）

### M8.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| M8.1.1 | DSL 简化配置（只用 speech + spotlight + wb_draw_shape）| 0.5 天 | M5 | DSL config |
| M8.1.2 | wb_draw_shape action 触发逻辑（mentor 决定何时画）| 1 天 | M8.1.1 | action trigger |
| M8.1.3 | 披萨图 SVG 组件（totalSlices / shadedSlices）| 1 天 | M8.1.1 | Pizza SVG |
| M8.1.4 | 白板渲染集成（chat UI 旁边或全屏）| 1 天 | M8.1.3 | whiteboard panel |
| M8.1.5 | Spotlight action 实现（聚焦错题元素）| 0.5 天 | M8.1.1 | spotlight effect |

### M8.2 验收标准

- [ ] mentor 讲到通分时触发 wb_draw_shape 画两个披萨
- [ ] 披萨图清晰展示 1/2 + 1/3
- [ ] Spotlight 聚焦错题元素
- [ ] 白板面板与对话 UI 协调

---

## M9 · 间隔重复调度（W5 D5-D6）

### M9.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| M9.1.1 | 艾宾浩斯曲线算法（1/3/7/14 天）| 0.5 天 | 无 | 算法 |
| M9.1.2 | 错题入库时自动调度下次复习 | 0.5 天 | M6, M9.1.1 | 自动调度 |
| M9.1.3 | 复习列表接口（GET /api/review/queue）| 0.5 天 | M9.1.1 | queue API |
| M9.1.4 | 复习界面（待复习列表 + 完成复习）| 0.5 天 | M9.1.3 | review UI |

### M9.2 验收标准

- [ ] 错题入库后 1/3/7/14 天自动出现在复习列表
- [ ] 孩子完成复习 → 更新下次时间
- [ ] 4 次复习后标记 mastered → 归档

---

## M10 · 学习报告 + 公众号周报（W6 D1-D3）

### M10.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| M10.1.1 | 学习报告接口（GET /api/report/weekly）| 1 天 | M6, M9 | report API |
| M10.1.2 | 报告数据计算（错题数 / 掌握度 / 复习建议）| 1 天 | M10.1.1 | calculation |
| M10.1.3 | 微信公众号模板消息 SDK 集成 | 1 天 | M0.1.2 | wechat push |

### M10.2 验收标准

- [ ] 周日晚上 7pm 自动推送
- [ ] 报告含 3 卡片（掌握度 / 错题 TOP 3 / 建议）
- [ ] 点击报告链接 → Web PWA 详情页

---

## M11 · 微信支付 + ¥99/月（W6 D4-D7）

### M11.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| M11.1.1 | 微信支付 V3 SDK 集成 | 1.5 天 | M0.1.3 | wechat pay |
| M11.1.2 | 支付宝集成（备用）| 1 天 | M11.1.1 | alipay |
| M11.1.3 | 订阅表 + 订单表 | 0.5 天 | M2 | schema |
| M11.1.4 | 30 天免费试用逻辑 | 0.5 天 | M11.1.3 | trial logic |
| M11.1.5 | 退款逻辑（7 天无理由）| 0.5 天 | M11.1.3 | refund |

### M11.2 验收标准

- [ ] ¥99/月支付成功
- [ ] ¥999/年支付成功
- [ ] 30 天试用自动激活
- [ ] 7 天无理由退款

---

## M12 · PIPL consent + ICP + 内容审核（W7 D1-D3）

### M12.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| M12.1.1 | PIPL consent UI（4 项勾选 + 强制）| 1 天 | M2 | consent UI |
| M12.1.2 | consent 记录表 + 审计 | 0.5 天 | M12.1.1 | audit log |
| M12.1.3 | ICP 备案（资质申请 M0.1.4 已完成）| 0.5 天 | M0.1.4 | 备案号 |
| M12.1.4 | 阿里云内容安全 SDK 集成（班主任/同学输出）| 1 天 | M5 | content filter |

### M12.2 验收标准

- [ ] 用户首次注册必须勾选 PIPL 4 项
- [ ] consent 记录可审计
- [ ] 班主任/同学输出经过关键词过滤
- [ ] ICP 备案号在页脚显示

---

## M13 · 阿里云部署（W7 D4-D6）

### M13.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| M13.1.1 | Docker 镜像构建（apps/cn）| 0.5 天 | M11, M12 | Dockerfile |
| M13.1.2 | 阿里云 ACK 集群配置 | 0.5 天 | M13.1.1 | ACK cluster |
| M13.1.3 | RDS PostgreSQL 创建 + 迁移 | 0.5 天 | M0 | RDS |
| M13.1.4 | 阿里云 OSS bucket + CDN | 0.5 天 | M6 | OSS |
| M13.1.5 | Redis 创建（缓存 session）| 0.5 天 | M13.1.3 | Redis |
| M13.1.6 | 监控 + 日志（CloudMonitor + Sentry）| 0.5 天 | M13.1.2 | monitoring |

### M13.2 验收标准

- [ ] 生产环境部署成功
- [ ] 域名 + HTTPS 可访问
- [ ] 监控告警正常

---

## M14 · 端到端测试（W8 D1-D5）

### M14.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| M14.1.1 | 用户注册 → 选 persona → 拍照错题 → Socratic 引导 → 复习 | 1 天 | M1-M13 | E2E flow |
| M14.1.2 | 微信支付完整流程 | 0.5 天 | M14.1.1 | pay E2E |
| M14.1.3 | 公众号周报推送 | 0.5 天 | M14.1.1 | wechat push E2E |
| M14.1.4 | PIPL consent 验证 | 0.5 天 | M14.1.1 | consent E2E |
| M14.1.5 | 性能测试（LLM 响应 p95 ≤ 8s）| 0.5 天 | M14.1.1 | perf test |
| M14.1.6 | Bug 修复（buffer）| 2 天 | M14.1.1-5 | bug fixes |

### M14.2 验收标准

- [ ] 完整 E2E 流程跑通
- [ ] LLM 响应 p95 ≤ 8s
- [ ] 没有 P0/P1 bug

---

## M15 · 灰度 + 正式上线（W9 D1-D3）

### M15.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| M15.1.1 | 灰度发布（10 个种子用户）| 1 天 | M14 | 灰度 |
| M15.1.2 | 收集反馈 + 紧急修复 | 0.5 天 | M15.1.1 | fixes |
| M15.1.3 | 正式上线（开放注册）| 0.5 天 | M15.1.2 | 正式发布 |
| M15.1.4 | 监控告警 24h 待命 | 1 天 | M15.1.3 | on-call |

### M15.2 验收标准

- [ ] 灰度用户无 P0 问题
- [ ] 正式上线稳定
- [ ] 数据看板显示关键指标

---

## CM1 · Classroom · Period 容器（CW1 · 与 W1 并行）

依据 [classroom-mode-design.md §6 W1](./classroom-mode-design.md#6-5-周增量实施)。

### CM1.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| CM1.1.1 | `<PeriodBar>` React 组件 + 与 playback 控件并存 | 1 天 | 无 | PeriodBar 组件 |
| CM1.1.2 | 3 个 DSL action（`period_start` / `period_end` / `period_bell`）schema validator | 0.5 天 | 无 | DSL schema 通过 |
| CM1.1.3 | `ClassroomState` reducer 接入 `useStageStore` | 0.5 天 | 无 | state ready |
| CM1.1.4 | period 倒计时（mm:ss）+ transition 动画 | 0.5 天 | CM1.1.1 | 动画完成 |
| CM1.1.5 | 单测 + e2e（一节课完整流程）| 0.5 天 | CM1.1.1-4 | tests pass |

### CM1.2 验收标准

- [ ] 顶部 PeriodBar 渲染"Lesson-1 / 倒计时 / 控制按钮"
- [ ] `period_end` 触发后自动转 `break` 状态
- [ ] 移动端 iPad auto-collapse 为底部 36px mini bar
- [ ] DSL schema validator 100% 通过（含 fixtures）

---

## CM2 · Classroom · 举手 + raise_hand（CW2 · 与 W2 并行）

**关键风险点**——必须用 `ClassroomService.callRaiseHand()` 独立 service 隔离（**不侵入 Director graph 主路径**，D-1 mitigation）。

### CM2.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| CM2.1.1 | 浮按钮 `<HandRaiseButton>` + 队列 toast UI | 1 天 | CM1 | 组件 ready |
| CM2.1.2 | `raise_hand` DSL action + 队列 reducer | 0.5 天 | CM1 | action 通过 |
| CM2.1.3 | `ClassroomService.callRaiseHand()` 隔离 service | 0.5 天 | CM2.1.1-2 | service ready |
| CM2.1.4 | 接入路由：`raise_hand` 优先级 > `discussionRequest` | 0.5 天 | CM2.1.3 | priority logic |
| CM2.1.5 | 队列满 3 人自动转 `cue_user` 给最久 | 0.5 天 | CM2.1.4 | fallback |
| CM2.1.6 | **全量 Socratic e2e 回归**（必须 100% pass）| 0.5 天 | CM2.1.5 | regression |

### CM2.2 验收标准

- [ ] 用户点击"举手"进入队列，agent 也可举手
- [ ] 队列有空位时按 FIFO；有空位 token
- [ ] 所有现有 Socratic 场景 e2e 100% 通过
- [ ] feature flag `classroom.enabled` 默认 ON；关闭后表现 = 当前 Roundtable 完全不变
- [ ] `ClassroomService` 完全独立 — Director graph 主路径 0 改动（CI diff 验证）

---

## CM3 · Classroom · 叫答 + call_on（CW3 · 与 W3 并行）

### CM3.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| CM3.1.1 | `<CallOnCard>` 复用 ProactiveCard + `mode="call_on"` | 1 天 | CM2 | 组件 ready |
| CM3.1.2 | `call_on` DSL action | 0.5 天 | CM2 | action 通过 |
| CM3.1.3 | 头像聚光（spotlight 机制复用）| 0.5 天 | CM3.1.1 | spotlight ok |
| CM3.1.4 | 准备倒计时（3-5s 可配） + 归零 fallback | 0.5 天 | CM3.1.1 | timer + fallback |
| CM3.1.5 | 单元测试 + e2e（call_on → 准备 → 自动 fallback）| 0.5 天 | CM3.1.4 | tests pass |

### CM3.2 验收标准

- [ ] 老师说"请 X 回答"，CallOnCard 显示，X 头像聚光
- [ ] 倒计时归零自动 fallback 为 cue_user
- [ ] target offline 自动降级为 cue_user + Director warning

---

## CM4 · Classroom · 同桌 + pass_note + seatLayout（CW4 · 与 W4 并行）

依据 D-2 决策：默认自动布局 + admin override。

### CM4.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| CM4.1.1 | `ClassroomLayoutService.autoGenerate()`（"邻座=同桌"算法）| 0.5 天 | CM2 | service ready |
| CM4.1.2 | admin settings UI（座位图可视化 + override 单个座位）| 0.5 天 | CM4.1.1 | admin UI |
| CM4.1.3 | `pass_note` DSL action + deskmates 校验 | 0.5 天 | CM4.1.1 | action 通过 |
| CM4.1.4 | 飞纸条动画（贝塞尔曲线）+ 收方 hint | 1 天 | CM4.1.3 | animation ok |
| CM4.1.5 | 同桌收方默认触发 `speech` 回应 | 0.5 天 | CM4.1.4 | cascade |
| CM4.1.6 | e2e（含 admin override 流程）| 0.5 天 | CM4.1.5 | tests pass |

### CM4.2 验收标准

- [ ] 老场景无 seatLayout → 默认自由席 + `pass_note` 自动禁用（warning）
- [ ] admin override 单个座位关系统一 refresh
- [ ] 飞纸条 SVG 路径流畅（≥30fps 移动端）
- [ ] 收方 agent 收到 `speech` hint 后 3s 内回应

---

## CM5 · Classroom · 黑板 + blackboard_annotate（CW5 · 与 W5 并行）

### CM5.1 任务列表

| # | 任务 | 工作量 | 依赖 | 产出 |
|---|---|---|---|---|
| CM5.1.1 | canvas 顶部 tab 加"白板/幻灯片"切换 | 0.5 天 | 无 | tab ready |
| CM5.1.2 | `blackboard_annotate` DSL action | 0.5 天 | 无 | action 通过 |
| CM5.1.3 | chalk-style 渲染层（SVG 轻量版，V1.1 再升级 canvas）| 1 天 | CM5.1.1 | renderer |
| CM5.1.4 | 全角色可写（用户也要能画）| 0.5 天 | CM5.1.3 | user input |
| CM5.1.5 | snapshot test + e2e（多角色协作）| 0.5 天 | CM5.1.4 | tests pass |

### CM5.2 验收标准

- [ ] 顶部 tab 切换顺利，白板层独立渲染
- [ ] 任何角色调用 `blackboard_annotate` 都生效
- [ ] stroke 数 ≤ 500 性能不衰减
- [ ] INTL 文案切换"homeroom teacher / circle time"成功（D-3 验证）

---

## CM · 跨 W 资源与人力

- 1 工程师 0.5 兼职（与主路径同 1 人分时）
- CW1 + CW5 完全独立（≤ 0.5 周工时）
- CW2-CW4 在 W2-W4 兼职工时内完成
- 加外包 ¥1 万（CM5 chalk 渲染验证 + INTL 文案校对）
- **总人力不变**（7 月 ¥66.5 万 → 仍 7 月，因并行不延 timeline）

---

## CM 风险与回退（D-1 mitigation）

| 风险 | 缓解 |
|---|---|
| Director graph 加 raise_hand 破坏 Socratic | CM2 用 `ClassroomService.callRaiseHand()` 隔离；CI diff 验证 0 主路径改动；feature flag 关闭 |
| seatLayout 老场景没座位 | `ClassroomLayoutService.autoGenerate()` 默认自由席 + `pass_note` 自动禁用 |
| Blackboard chalk 性能 | 用 SVG 轻量版（≤500 strokes），V1.1 升级 canvas |
| 移动端 PeriodBar 拥挤 | 自动折叠底部 36px mini bar |
| INTL 文案缺失 | `classroom.cn.json` + `classroom.intl.json` 双 bundle；失败回退 cn |

---

## 任务依赖图

```
M0 ────────────── (并行，资质申请)
 ↓
M1 → M2 → M3 → M4 → M5 ───┐
              ↓           │
              M6 ───┬─────┤
              ↓     │     │
              M7 ←──┤     │
              ↓     │     │
              M8 ←──┘     │
              ↓           │
              M9 ←─────────┘
              ↓
              M10 → M11 → M12 → M13 → M14 → M15
```

---

## 关键路径（critical path）

```
M1（3天）→ M2（3天）→ M3（3天）→ M4（4天）→ M5（1周）→
M6（4天）→ M7（3天）→ M8（4天）→ M10（3天）→ M11（4天）→
M13（3天）→ M14（1周）→ M15（3天）

总计：3+3+3+4+5+4+3+4+3+4+3+5+3 = 47 工作日 ≈ 9-10 周
```

---

## 资源与人天对照

| 资源 | 人天 |
|---|---|
| 工程师 A（全栈）| ~80% 工作量 |
| 工程师 B（内容）| ~50% 工作量（仅 M3-M5 / M7-M8）|
| 设计 C（外包）| ~30% 工作量 |
| 法务顾问 | ~5 天（一次性）|

---

## 风险与回退方案

| 风险 | 回退方案 |
|---|---|
| M5 Director 多轮扩展延期 | 用单轮 + 手动注入 buddy 消息（退化体验）|
| M6 OCR 不准 | 强制用户手动填写正确答案 |
| M10 公众号模板消息未到 | 临时用 Email digest |
| M11 微信支付商户号未到 | 临时用 Stripe + Email 推送 |

---

## 决策点（已确认）

| # | 决策 | 状态 |
|---|---|---|
| 1 | Web PWA only（不做 Electron MVP） | ✅ |
| 2 | 保留 1 mentor + 2 buddies（多 agent 核心）| ✅ |
| 3 | Socratic 8 条规则严格遵守 | ✅ |
| 4 | 简化 DSL（speech + spotlight + wb_draw_shape）| ✅ |
| 5 | 简化 Whiteboard（披萨图）| ✅ |
| 6 | 间隔重复 1/3/7/14 天 | ✅ |
| 7 | Freemium + ¥99/月 + 年付 ¥999 | ✅ |
| 8 | PIPL + 双减（辅导定位）| ✅ |
| 9 | 阿里云 cn-region | ✅ |
| 10 | 7-9 周 MVP + ¥120-150 万 + 1-2 人 | ✅ |
| 11 | **Classroom Mode（C）V1 同步上**：CW1-CW5 与 W1-W5 **并行**；raise_hand 走独立 `ClassroomService.callRaiseHand()`（不侵入 Director 主路径）；ClassroomLayoutService 自动生成 seatLayout + admin override（[decision log §0](./classroom-mode-design.md#0-user-decisions-log-2026-08-25)）| ✅ |

---

下一步选项：

- **a.** 开始执行 M1（Web PWA 壳初始化）
- **b.** 调整任务（砍/加/改）
- **c.** 暂停，先做 INTL MVP 任务
- **d.** 暂停，先做床头讲故事任务

我推荐 **a**——MVP W1 启动。
