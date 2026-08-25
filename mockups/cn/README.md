# 小诺学伴 · CN 伴读系统 Mockup 文档

**Date**: 2026-08-25
**Status**: ✅ 30 个 mockup / 18 个 SOP / ~8300 行
**对应产品**：[cn-product.md](../../specs/cn-product.md)
**对应 MVP**：[cn-companion-mvp-plan.md](../../specs/cn-companion-mvp-plan.md)
**对应 SOP**：[cn-companion-sop.md](../../specs/cn-companion-sop.md)

> **本文档是 30 个 CN 伴读系统 mockup 的索引**——按角色（家长/孩子/Onboarding/管理员）和 SOP 节点组织，每个 mockup 含用途、UI 元素、设计原则。

---

## 1. Mockup 清单（30 个）

### 1.1 家长端（5 个）

| # | Mockup | 对应 SOP | 用途 |
|---|---|---|---|
| P-1 | [`landing-h5.html`](./landing-h5.html) | SOP 1 访客 | H5 落地页 + Socratic 示例 + CTA |
| P-2 | [`kids-select.html`](./kids-select.html) | Onboarding 孩子切换 | 同家庭多孩选择 + persona 显示 |
| P-3 | [`learning-report.html`](./learning-report.html) | 家长看周报 | 3 卡片周报（掌握度/错题 TOP 3/建议） |
| P-4 | [`add-kid.html`](./add-kid.html) | SOP 2 多孩管理 | 添加第 2 个孩子 + 套餐检查 + 选 persona |
| P-5 | [`upgrade-family.html`](./upgrade-family.html) | SOP 3 升级家庭版 | 单孩 → 家庭版差价计算 |

### 1.2 家长设置（5 个）

| # | Mockup | 对应 SOP | 用途 |
|---|---|---|---|
| P-6 | [`subscription-cancel.html`](./subscription-cancel.html) | SOP 4 退订/注销 | 退订类型 + 原因 + 退订前后对比表 |
| P-7 | [`account-security.html`](./account-security.html) | SOP 5 账号安全 | 修改密码 + 二次验证 + 登录管理 |
| P-8 | [`notification-prefs.html`](./notification-prefs.html) | SOP 6 推送设置 | 周报/错题/学习建议 + 静默时段 |
| P-9 | [`swap-persona.html`](./swap-persona.html) | SOP 7 修改 persona | 换班主任 + 锁定进度（100 天后解锁）|
| P-10 | [`pipl-data.html`](./pipl-data.html) | SOP 8 PIPL 数据 | 导出/删除/限制 3 权利 + 删除 modal |

### 1.3 Onboarding（4 个，新增）

| # | Mockup | 对应 MVP | 用途 |
|---|---|---|---|
| O-1 | [`pwa-install.html`](./pwa-install.html) | M1 PWA 安装 | "添加到主屏幕" 提示 + 离线能力说明 |
| O-2 | [`register-login.html`](./register-login.html) | M2 注册登录 | 手机号 + 微信扫码双入口 |
| O-3 | [`pipl-consent.html`](./pipl-consent.html) | M12 PIPL 4 项同意 | 必勾选 + 未成年独立同意 |
| O-4 | [`payment-success.html`](./payment-success.html) | M11 支付成功 | 微信支付 V3 成功页 + 添加孩子 CTA |

### 1.4 孩子端 K12（5 个，含 1 原 + 4 新）

| # | Mockup | 对应 SOP | 用途 |
|---|---|---|---|
| K-1 | [`socratic-dialogue.html`](./socratic-dialogue.html) | 错题讲解核心 | 1 mentor + 2 buddies + 白板披萨图 |
| K-2 | [`mistake-list.html`](./mistake-list.html) | 错题本 | 错题列表 + 状态筛选 + 艾宾浩斯标签 |
| K-3 | [`mistake-camera.html`](./mistake-camera.html) | 拍照 OCR | 取景框 + 多题分割 + 学科识别 |
| K-4 | [`mistake-manual.html`](./mistake-manual.html) | 手动添加 | 表单 + 拍照/选择/快捷 3 选项 |
| K-5 | [`mistake-detail.html`](./mistake-detail.html) | 错题详情 | 题目 + 步骤 + 时间线 + Socratic 历史 |

### 1.5 复习（1 个，新增）

| # | Mockup | 对应 SOP | 用途 |
|---|---|---|---|
| R-1 | [`review-queue.html`](./review-queue.html) | 艾宾浩斯复习 | 1/3/7/14/30 天间隔 + 复习题型选择 |

### 1.6 合规 / 客服（2 个）

| # | Mockup | 对应 SOP | 用途 |
|---|---|---|---|
| C-1 | [`complaint.html`](./complaint.html) | SOP 9 投诉/申诉 | 6 类型 + SLA 24/48/72h + 紧急投诉 |
| C-2 | [`minor-protection.html`](./minor-protection.html) | SOP 10 未成年保护 | ≤60 分钟 + 夜间禁用 + PIN 验证 |

### 1.7 通用（1 个，新增）

| # | Mockup | 对应 MVP | 用途 |
|---|---|---|---|
| X-1 | [`404.html`](./404.html) | 通用错误页 | 空状态 + 返回首页 + 帮助 |

### 1.8 管理员端（7 个，新增）

| # | Mockup | 对应 SOP | 用途 |
|---|---|---|---|
| A-1 | [`admin-login.html`](./admin-login.html) | O-1 管理员登录 | 邮箱密码 + 2FA + 角色识别 |
| A-2 | [`admin-review.html`](./admin-review.html) | O-2 内容审核 | 待审队列 + 危险词高亮 + 通过/拒绝 |
| A-3 | [`admin-users.html`](./admin-users.html) | O-3 用户管理 | 查询 + 停用 + 退款（表格视图）|
| A-4 | [`admin-personas.html`](./admin-personas.html) | O-4 Persona CRUD | 班主任模板增删改 + 满意度统计 |
| A-5 | [`admin-textbooks.html`](./admin-textbooks.html) | O-5 Textbook 管理 | PDF 上传 + 章节解析状态 |
| A-6 | [`admin-templates.html`](./admin-templates.html) | O-6 推送模板 | 微信公众号模板消息编辑 + 变量 |
| A-7 | [`admin-dashboard.html`](./admin-dashboard.html) | O-7 数据看板 | KPI 卡片 + 7 日图表 + 章节错题 TOP |

### 1.9 Classroom Mode V1（5 + 1 主视图 · CM1-CM5，新增）

依据 [`classroom-mode-design.md`](../../specs/classroom-mode-design.md) · CW1-CW5 与 W1-W5 **并行**（D-1 决策）。

| # | Mockup | 对应 W | 用途 |
|---|---|---|---|
| CW1 | [`classroom-period-bar.html`](./classroom-period-bar.html) | CM1 | 顶部 Period Bar · 4 状态（lesson/break/after/attention）+ 移动端 mini bar |
| CW2 | [`classroom-hand-raise.html`](./classroom-hand-raise.html) | CM2 | 浮按钮 HandRaise + 队列 FIFO + 满 3 自动 cue_user（ClassroomService 隔离）|
| CW3 | [`classroom-call-on.html`](./classroom-call-on.html) | CM3 | 叫答卡片 CallOnCard + 头像聚光 + 倒计时 fallback |
| CW4 | [`classroom-pass-note.html`](./classroom-pass-note.html) | CM4 | 飞纸条动画 + 同桌关系 + 邻桌校验（D-2 auto + override）|
| CW5 | [`classroom-blackboard.html`](./classroom-blackboard.html) | CM5 | Canvas tab 切换 + chalk 笔触 + 全角色可写 |
| Master | [`classroom-overview.html`](./classroom-overview.html) | CW1-CW5 | 主视图整合（5 元素全部呈现）|

**INTL V1 兼容（D-3）**：i18n bundle `classroom.intl.json` 切换文案 "Lesson-1" → "Circle Time 1"、"break" → "Recess"、"老师" → "homeroom teacher"；功能 100% 复用。

---

## 2. 完整 SOP ↔ Mockup 对应

| SOP 节点 | Mockup | 状态 |
|---|---|---|
| SOP 1 访客 | landing-h5.html | ✅ |
| SOP 2 多孩管理 | add-kid.html | ✅ |
| SOP 3 升级家庭版 | upgrade-family.html | ✅ |
| SOP 4 退订/注销 | subscription-cancel.html | ✅ |
| SOP 5 账号安全 | account-security.html | ✅ |
| SOP 6 推送设置 | notification-prefs.html | ✅ |
| SOP 7 修改 persona | swap-persona.html | ✅ |
| SOP 8 PIPL 数据 | pipl-data.html | ✅ |
| SOP 9 投诉/申诉 | complaint.html | ✅ |
| SOP 10 未成年保护 | minor-protection.html | ✅ |
| M1 PWA 安装 | pwa-install.html | ✅ |
| M2 注册登录 | register-login.html | ✅ |
| M6 错题本 | mistake-list.html + mistake-camera.html + mistake-manual.html | ✅ |
| K-6 错题详情 | mistake-detail.html | ✅ |
| M9 艾宾浩斯复习 | review-queue.html | ✅ |
| M11 支付成功 | payment-success.html | ✅ |
| M12 PIPL 同意 | pipl-consent.html | ✅ |
| 通用 404 | 404.html | ✅ |
| CW1 · Period Bar | classroom-period-bar.html | ✅ |
| CW2 · 举手 + raise_hand | classroom-hand-raise.html | ✅ |
| CW3 · 叫答 + call_on | classroom-call-on.html | ✅ |
| CW4 · 同桌 + pass_note | classroom-pass-note.html | ✅ |
| CW5 · 黑板 + blackboard_annotate | classroom-blackboard.html | ✅ |
| Classroom 主视图 | classroom-overview.html | ✅ |
| O-1 管理员登录 | admin-login.html | ✅ |
| O-2 内容审核 | admin-review.html | ✅ |
| O-3 用户管理 | admin-users.html | ✅ |
| O-4 Persona 管理 | admin-personas.html | ✅ |
| O-5 Textbook 管理 | admin-textbooks.html | ✅ |
| O-6 推送模板 | admin-templates.html | ✅ |
| O-7 数据看板 | admin-dashboard.html | ✅ |

**18/18 SOP mockup 覆盖 + 4 个新增分类（Onboarding/复习/通用/管理员）**。

---

## 3. Mockup 设计原则

### 3.1 视觉风格

家长端 / 孩子端共享统一规范，管理员端单独配色（深色专业风格）。

#### 3.1.1 用户端配色（家长 + 孩子 + Onboarding）

| 维度 | 设计 |
|---|---|
| **主色** | 💜 Lavender · `#722ed1`（OpenMAIC 默认） |
| **辅色** | 🌸 Pink `#ec4899`（小红）/ 🍊 Orange `#f59e0b`（阿泽） |
| **中性** | 🟢 Green `#10b981`（成功）/ 🔴 Red `#dc2626`（错误）/ 🟡 Amber `#f59e0b`（警告）/ 🔵 Blue `#3b82f6`（信息） |
| **背景** | `--bg: #faf9fe`（极浅紫） |
| **字体** | `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif` |
| **圆角** | 卡片 14-16px / 按钮 10-12px / 输入 10px |
| **阴影** | 卡片 `0 2px 8px rgba(114,46,209,0.04)` |
| **断点** | 移动 < 480px / 平板 480-900px / 桌面 > 900px |

#### 3.1.2 管理员端配色（深色专业）

| 维度 | 设计 |
|---|---|
| **主色** | 🔵 Blue · `#3b82f6`（管理后台专业感） |
| **背景** | `--bg: #0f172a`（深蓝黑） |
| **卡片** | `--surface: #1e293b` |
| **强调** | 🟢 Green `#10b981`（成功）/ 🟡 Amber `#f59e0b`（警告）/ 🔴 Red `#ef4444`（错误） |
| **布局** | 固定侧边栏 220px + 主内容（区别于用户端响应式）|

> 区分原因：用户端用暖紫色突出"陪伴/家庭"情感；管理员端用冷蓝色突出"专业/工具"属性。

### 3.2 组件复用

每个 mockup 顶部都有：

**用户端**：
```html
<div class="anno">
  <div class="anno-icon">!</div>
  <div>
    <strong>SOP 名称</strong>：核心场景一句话描述
  </div>
</div>
```

**管理员端**：
```html
<div class="anno">📚 O-5 · Textbook 管理 · 上传教材 → PDF 解析 → 章节结构</div>
```

黄色 annotation banner 标识每个 mockup 的 SOP 归属。

### 3.3 颜色语义（用户端）

| 场景 | 颜色 | CSS 变量 |
|---|---|---|
| mentor / 班主任 | 紫色 | `--primary` `#722ed1` |
| 小红（buddy） | 粉色 | `--hong` `#ec4899` |
| 阿泽（buddy） | 橙色 | `--aze` `#f59e0b` |
| 孩子（me） | 蓝色 | `--me` `#3b82f6` |
| 成功 | 绿色 | `--success` `#10b981` |
| 警告 | 黄色 | `--warn` `#f59e0b` |
| 错误 / 删除 | 红色 | `--danger` `#dc2626` |
| 信息 | 蓝色 | `--info` `#3b82f6` |

### 3.4 响应式

**用户端**：所有 mockup 在 480px / 900px 断点切换布局：
- 移动：单列堆叠
- 平板：两列
- 桌面：分栏 + 详情面板

**管理员端**：固定桌面布局（管理员通常用 PC 操作）。

### 3.5 静态状态

mockup 是**静态 HTML**，所有按钮 / 表单不连真实逻辑。点击效果仅模拟视觉反馈（如选中态切换、modal 弹出）。

---

## 4. 关键 UI 模式

### 4.1 3 角色头像配色（用户端）

```
👩‍🏫 小诺姐姐 (mentor)  → 紫色 `#722ed1`
👧 小红 (buddy-hong)     → 粉色 `#ec4899`
👦 阿泽 (buddy-aze)     → 橙色 `#f59e0b`
🧒 孩子 (me)             → 蓝色 `#3b82f6`
```

### 4.2 管理员端模式

- 侧边栏 220px（固定） + 主内容（滚动）
- KPI 卡片 grid（4 列）
- 表格 + 状态徽章
- 图表用纯 CSS（bar / donut），无外部依赖

### 4.3 卡片模式

```css
.card {
  background: var(--surface);
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 14px;
  border: 1px solid var(--line);
}
```

### 4.4 Annotation banner

```css
.anno {
  background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
  border: 1px dashed #facc15;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: #854d0e;
}
```

### 4.5 Toggle 开关

```css
.toggle {
  width: 44px; height: 26px;
  border-radius: 13px;
  background: var(--line);
  position: relative;
  cursor: pointer;
}
.toggle.on { background: var(--success); }
```

---

## 5. 怎么浏览

### 5.1 单独浏览

直接用浏览器打开 mockup 文件：
- Windows：`start mockups/cn/socratic-dialogue.html`
- macOS：`open mockups/cn/socratic-dialogue.html`
- 浏览器：拖到 Chrome / Edge / Safari 窗口

### 5.2 索引页

打开 [`mockups/cn/index.html`](./index.html) 查看所有 30 个 mockup 的卡片网格 + 预览链接。

### 5.3 演示流程

打开 [`mockups/cn/demo-flow.html`](./demo-flow.html) 自动播放 30 个 mockup 的完整 SOP 流程（用 iframe 加载，每 5 秒切换）。

### 5.4 演示视频

#### 5.4.1 分角色视频（推荐）

每个角色单独录制的 SOP 流程视频：

| 角色 | 视频 | 步骤 | 时长 | 大小 |
|---|---|---|---|---|
| 👨‍👩‍👧 家长 | [`demo-parent.mp4`](./videos/demo-parent.mp4) | 14 步 | 73s | 1.7 MB |
| 🧒 孩子 | [`demo-child.mp4`](./videos/demo-child.mp4) | 6 步 | 39s | 1.2 MB |
| ⚙️ 管理员 | [`demo-admin.mp4`](./videos/demo-admin.mp4) | 7 步 | 38s | 1.2 MB |
| 🛡️ 客服 | [`demo-support.mp4`](./videos/demo-support.mp4) | 3 步 | 18s | 0.4 MB |
| 🎓 Classroom | [`demo-classroom.mp4`](./videos/demo-classroom.mp4) | 6 步 | 42s | 1.3 MB |

每段视频都附了 GIF 预览（`demo-{role}.gif`）方便在文档/PPT 里直接展示。

#### 5.4.2 完整 30 步视频

[`mockups/cn/videos/demo-flow.mp4`](./videos/demo-flow.mp4) — 完整 30 个 mockup 的录屏（适合一次性完整展示）。

### 5.5 演示站点

打开 [`mockups/index.html`](../index.html) 查看完整 demo 站点（多语言 + 多主题）。

### 5.6 重新录制

```bash
cd mockups/cn
node demo-record.js
```

自动录 4 个角色视频 + 转换 MP4 + 生成 GIF 预览。

---

## 6. Mockup 文件结构

```
mockups/cn/
├── README.md                    ← 本文档（30 mockup 索引）
├── index.html                   ← HTML 索引页（30 卡片网格）
├── demo-flow.html               ← 30 mockup 自动播放演示
│
├── 家长端（5）
│   ├── landing-h5.html              SOP 1 访客
│   ├── kids-select.html             P-2 多孩选择
│   ├── learning-report.html         P-3 家长周报
│   ├── add-kid.html                 SOP 2 多孩管理
│   └── upgrade-family.html          SOP 3 升级家庭版
│
├── 家长设置（5）
│   ├── subscription-cancel.html     SOP 4 退订
│   ├── account-security.html        SOP 5 账号安全
│   ├── notification-prefs.html      SOP 6 推送设置
│   ├── swap-persona.html            SOP 7 修改 persona
│   └── pipl-data.html               SOP 8 PIPL 数据
│
├── Onboarding（4 新增）
│   ├── pwa-install.html             M1 PWA 安装
│   ├── register-login.html          M2 注册登录
│   ├── pipl-consent.html            M12 PIPL 同意
│   └── payment-success.html         M11 支付成功
│
├── 孩子端 K12（5，1 原 + 4 新）
│   ├── socratic-dialogue.html       K-5 错题讲解核心
│   ├── mistake-list.html            错题本列表
│   ├── mistake-camera.html          拍照 OCR
│   ├── mistake-manual.html          手动添加
│   └── mistake-detail.html          K-6 错题详情
│
├── 复习（1 新增）
│   └── review-queue.html            M9 艾宾浩斯复习
│
├── 合规 / 客服（2）
│   ├── complaint.html               SOP 9 投诉
│   └── minor-protection.html        SOP 10 未成年保护
│
├── 通用（1 新增）
│   └── 404.html                     通用错误页
│
└── 管理员端（7 新增）
    ├── admin-login.html             O-1 管理员登录
    ├── admin-review.html            O-2 内容审核
    ├── admin-users.html             O-3 用户管理
    ├── admin-personas.html          O-4 Persona CRUD
    ├── admin-textbooks.html         O-5 Textbook 管理
    ├── admin-templates.html         O-6 推送模板
    └── admin-dashboard.html         O-7 数据看板
```

---

## 7. 设计取舍

### 7.1 静态 vs 交互

**取舍**：当前 mockup 是**静态 HTML**，不连后端 API。

| 优势 | 劣势 |
|---|---|
| 不需要启动 dev server | 不能测试真实流程 |
| 快速 review | 不能 demo 数据流 |
| 设计验证快 | 多设备适配需要手动测 |

**未来**：Phase 2 之后，将 mockup 转为 Next.js 页面，连真实 API。

### 7.2 单页 vs 多页

**取舍**：每个 SOP 节点一个独立 HTML 文件。

| 优势 | 劣势 |
|---|---|
| 演示聚焦 | 不能演示完整流程（demo-flow 解决）|
| 改动互不影响 | 需要手动跳转 |
| URL 可分享 | 文件数量多 |

**未来**：用 mockups/index.html 统一组织为卡片网格 + 链接；demo-flow.html 统一组织为自动播放。

### 7.3 用户端 vs 管理员端分离

**取舍**：用户端（暖紫）和管理员端（深蓝）使用两套色系。

- 用户端：突出"陪伴/家庭"情感 → 暖色 + 圆润
- 管理员端：突出"专业/工具"属性 → 冷色 + 紧凑表格

两套色系独立 CSS 变量，互不污染。

### 7.4 移动优先 vs 桌面优先

**取舍**：
- 用户端：移动优先（家长用手机，孩子用平板/桌面）
  - 默认 360px 宽布局
  - 480px 切换两列
  - 900px 切换分栏
- 管理员端：桌面优先（管理员用 PC 操作）
  - 固定侧边栏 220px
  - 主内容滚动

---

## 8. Mockup → MVP 任务对应

### 8.1 用户端（家长 + 孩子）

| Mockup | MVP 任务 | 优先级 |
|---|---|---|
| landing-h5.html | 营销页（Phase 1.1）| Phase 1.1 |
| register-login.html | M2 用户系统 | W1 |
| pwa-install.html | M1 PWA 壳 | W1 |
| pipl-consent.html | M12 PIPL | W7 |
| kids-select.html | M5.1 添加孩子 | W2 |
| add-kid.html | M5.1 + M3 + M4 | W2 |
| upgrade-family.html | M11 支付 | W6 |
| subscription-cancel.html | M11 + 退订流程 | Phase 1.1 |
| account-security.html | M2 用户系统 | W1 |
| notification-prefs.html | M10 推送 | W6 |
| swap-persona.html | M3 + M4 + 锁定逻辑 | W2 |
| pipl-data.html | M12 PIPL | W7 |
| socratic-dialogue.html | M5 + M6 + M7 + M8 | W3-W5 |
| mistake-list.html | M6 错题本 | W3 |
| mistake-camera.html | M6 OCR | W4 |
| mistake-manual.html | M6 手动 | W4 |
| mistake-detail.html | M6 错题详情 | W4 |
| review-queue.html | M9 复习 | W5 |
| payment-success.html | M11 支付成功 | W6 |
| learning-report.html | M10 周报 + M0.1.2 | W6 |
| complaint.html | 客服系统（Phase 1.1）| Phase 1.1 |
| minor-protection.html | M12 时长限制 | W7 |
| 404.html | 通用错误页 | W1 |

### 8.2 管理员端（Phase 2+ 延后）

| Mockup | 运营任务 | 优先级 |
|---|---|---|
| admin-login.html | 管理员登录 | Phase 2.1 |
| admin-dashboard.html | O-7 数据看板 | Phase 2.2 |
| admin-review.html | O-2 内容审核 | Phase 2.3 |
| admin-users.html | O-3 用户管理 | Phase 2.4 |
| admin-personas.html | O-4 Persona CRUD | Phase 2.5 |
| admin-textbooks.html | O-5 Textbook 管理 | Phase 2.6 |
| admin-templates.html | O-6 推送模板 | Phase 2.7 |

---

## 9. 下一步

- **a.** 进入 MVP W1 任务（Web PWA 壳初始化）
- **b.** 写 INTL mockup（homeschool 系统）
- **c.** 把 mockup 转为 Next.js 真实页面
- **d.** 暂停 mockup，进入 writing-plans

我推荐 **a**——30 个 mockup + 18 个 SOP 完整闭环，spec + 视觉验证充分，可以开始 MVP W1 编码。

---

## 10. 变更日志

| Date | 变更 | 新增文件 |
|---|---|---|
| 2026-08-25 | 初始 13 个 mockup | landing / kids / report / add-kid / upgrade / cancel / security / notify / swap / pipl-data / socratic / complaint / minor |
| 2026-08-25 | "全部补齐" 完成 17 个 mockup | pwa-install / register-login / pipl-consent / mistake-{list,camera,manual,detail} / review-queue / payment-success / 404 + 7 admin |
| 2026-08-25 | 更新 README + demo-flow 含全部 30 | — |
| 2026-08-25 | Classroom Mode (C) 6 mockups · CW1-CW5 + master | classroom-period-bar / hand-raise / call-on / pass-note / blackboard / overview |
| 2026-08-25 | CN MVP plan + tasks 集成 CW1-CW5 并行 | — |
| 2026-08-25 | 录 Classroom 视频 + demo-flow-classroom.html | demo-classroom.mp4 + .gif |
