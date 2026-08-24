# OpenMAIC Companion · Product Spec (region-driven)

**Date**: 2026-08-25 (rev: region-driven refactor)
**Status**: Draft · Pending review
**Architecture**: Single product, region-scoped configuration

---

## 1. Overview

### 1.1 Product Positioning

OpenMAIC Companion is a single multi-region AI companion learning product. Each region (CN / US-TX / AU-NSW / SG / EU-DE / ...) is configured via JSON in `regions/<region>/`. The same code, same spec, same core — only configuration differs.

The product solves a universal pain: **a child needs a teacher who's always available**. Region-specific flavors (Chinese dual-income family vs US home school vs SG expat) are config, not code.

### 1.2 Architectural Principle

> **All regional differences live in `regions/<region>/config.json`.**
> **All code paths that vary by region call into `core/` abstractions** (`NotificationChannel`, `TextbookAdapter`, `ComplianceGuard`, `PersonaRegistry`, `I18nProvider`).

| Region-specific (config) | Region-agnostic (core code) |
|---|---|
| Persona templates (names, personas, voices) | Director graph |
| Textbooks (chapter codes / standard codes) | Error reasoner |
| Push channels (WeChat / Email / WhatsApp / SMS) | Knowledge graph |
| Compliance (PIPL / COPPA / FERPA / GDPR-K) | RBAC middleware |
| Onboarding steps (extra WeChat bind / WhatsApp opt-in) | Spaced repetition |
| Pricing (¥99-299 / $19.99-49.99 / SGD 25-60 / €18-45) | Audit logs |
| UI palette / illustrations | Pomodoro timer |
| i18n strings | Socratic prompt engine |

### 1.3 Target Users (universal across regions)

- **Student**: K-6 (ages 5-12), in school or home school
- **Parent**: 25-45 yo, primary teacher at home, wants AI teaching assistant
- **Operator / Content curator**: PC Web admin, creates personas + textbooks + configures regions
- **Platform admin**: global configuration

### 1.4 Universal Pain Points → Universal Solutions

| Pain | Solution (universal) | Region-specific flavor |
|---|---|---|
| Teacher can't always be available | AI mentor + study buddies (always on) | Persona names per region (mentor/班主任) |
| Student lacks peers | 2 AI study buddies, regional feel | Cities assigned by region |
| No record-keeping | Auto Portfolio / mistake book | Format adapts to region |
| Hard to assess | Knowledge graph + mastery scores | Standards map to region textbooks |
| Hard to involve parent | Push digest (region channel) | Email / WhatsApp / WeChat |

### 1.5 Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Architecture | **Single product + region config** | All regional differences are config, not code |
| Persona creation | **Operator-created templates, parent tweakable** | Quality control + personalization |
| Mentor memory isolation | **Strict per-student** | COPPA / PIPL / GDPR-K + safety |
| Parent sees mentor chat | **Default summary + on-demand full** | Privacy by default |
| Operator RBAC | **Per-region assignment** | Data minimization |
| Push channels | **Per-region enabled set** | CN=WeChat, US=Email+WhatsApp, EU=Email |
| Textbooks | **Operator-uploaded per region** | No hardcoded product-textbook coupling |
| Onboarding | **Region-driven step list** | CN adds WeChat scan, US adds WhatsApp opt-in |
| Pricing | **Per-region pricing config** | Local purchasing power |
| Compliance | **Per-region guard middleware** | PIPL / COPPA / FERPA / GDPR-K |

### 1.6 File Structure

```
D:/projects/openmaic/
├── specs/companion.md           ← this file (canonical single spec)
├── apps/
│   ├── README.md
│   └── companion/               ← product sub-project
│       ├── README.md
│       ├── SPEC.md              ← copy of canonical spec (sub-project owns)
│       └── regions/             ← region-scoped configs (operator-editable)
│           ├── cn/config.json
│           ├── us-tx/config.json
│           ├── au-nsw/config.json
│           ├── sg/config.json
│           └── eu-de/config.json
├── mockups/                     ← UI mockups (region-agnostic + per-region)
│   ├── region-picker.html       ← NEW: first-launch region select
│   ├── admin-region-config.html ← NEW: operator configures regions
│   ├── classroom-layout-c3.html
│   ├── student-home.html
│   ├── admin-console.html
│   ├── wechat-push.html         ← CN-flavored push
│   ├── whatsapp-push.html       ← INTL-flavored push
│   ├── cn-parent-recording.html ← CN region feature
│   ├── cn-wechat-moments-share.html ← CN region feature
│   ├── home-school-classroom.html ← INTL region feature (US/AU)
│   └── home-school-parent-dashboard.html ← INTL region feature
├── lib/companion-core/          ← shared core (future)
└── packages/@openmaic/*         ← existing OpenMAIC packages (shared)
```

---

## 2. Region Configuration Schema

### 2.1 Region Config Schema

```ts
// regions/<region>/config.json
interface RegionConfig {
  region: string;              // "cn" | "us-tx" | "au-nsw" | "sg" | "eu-de" | ...
  displayName: string;         // "中国大陆" | "United States (Texas)" | ...
  defaultLocale: string;       // "zh-CN" | "en-US" | "en-AU" | ...
  supportedLocales: string[];  // ["zh-CN"] | ["en-US", "es-US"] | ...

  // Personas (operator-uploaded templates)
  personas: {
    mentors: PersonaTemplate[];
    buddies: PersonaTemplate[];
    parentAssistants: PersonaTemplate[];
    operatorAssistants?: PersonaTemplate[];  // v2+
  };

  // Textbooks (operator-uploaded)
  textbooks: TextbookAdapter[];

  // Push channels (per-region enabled set)
  channels: ChannelConfig[];

  // Compliance (region-specific guard)
  compliance: ComplianceConfig;

  // Onboarding (region-driven steps)
  onboarding: OnboardingStep[];

  // Pricing (region-local)
  pricing: PricingConfig;

  // Visual identity (optional, overrides defaults)
  palette?: {
    primary: string;
    background: string;
    surface: string;
    // ...
  };
  illustrations?: string;      // path to illustration set

  // Feature flags (per-region enable)
  features: {
    classroomRecording: boolean;
    momentsShare: boolean;
    speechEvaluation: boolean;
    mapTestPrep: boolean;
    // ...
  };

  // i18n (region-specific overrides)
  i18n: Record<string, string>;  // locale -> translations JSON path
}

interface PersonaTemplate {
  id: string;                  // unique within region
  role: "mentor" | "buddy" | "parent_assistant";
  name: string;                // "小诺姐姐" | "Ms. Maple" | ...
  persona: string;              // 2-3 sentence persona text
  voiceConfig: VoiceConfig;    // TTS voice + emotion + pace
  avatarPath: string;
  color: string;
  // Optional: regional seed data
  region?: {                   // for buddies only
    city?: string;             // "Brooklyn" | "上海" | ...
    country?: string;
  };
  // Optional: prompt template (overrides default Socratic)
  promptOverride?: string;
  // Operator can mark deprecated; users can clone + customize
  isTemplate: true;
  deprecationNotice?: string;
}

interface VoiceConfig {
  provider: string;            // "minimax" | "openai" | "elevenlabs" | ...
  voiceId: string;
  emotion?: string;            // "warm" | "energetic" | "calm"
  pace?: "slow" | "medium" | "fast";
  language?: string;           // BCP-47
}

interface TextbookAdapter {
  id: string;                  // unique within region
  name: string;                // "人教版 4 年级数学" | "Common Core Grade 4 Math" | ...
  version: string;             // "2024-edition" | "CCSS-2024"
  subject: string;             // "math" | "ela" | "science" | ...
  grade: number;               // K=0, 1-12
  chapterSchema: "chapter_code" | "standard_code";  // how knowledge points are addressed
  chapters: TextbookChapter[];
  // Or for Common Core:
  standards?: StandardCode[];  // "4.NF.A.1", "4.NF.A.2", ...
  source: string;              // PDF path or external URL
  uploadedBy: string;          // operator user id
  uploadedAt: number;          // unix ms
}

interface TextbookChapter {
  code: string;                // "4-NF-A-1" | "4.NF.A.1"
  title: string;
  parentCode?: string;         // for hierarchy
  concepts: string[];          // sub-concepts for mastery breakdown
}

interface ChannelConfig {
  channel: "wechat_miniapp" | "wechat_official" | "email" | "whatsapp" | "sms" | "push";
  enabled: boolean;
  // Per-channel config
  config: {
    // WeChat
    appId?: string;
    miniProgramId?: string;
    templateIds?: string[];
    // Email
    fromAddress?: string;
    provider?: "sendgrid" | "resend" | "ses";
    // WhatsApp
    businessAccountId?: string;
    templateName?: string;
    languageCode?: string;
    // SMS
    twilioAccountSid?: string;
    fromNumber?: string;
    // Push
    vapidPublicKey?: string;
  };
  defaultFrequency: "daily" | "weekly" | "biweekly" | "monthly" | "off";
  defaultTime: string;          // "21:00" (local)
}

interface ComplianceConfig {
  region: string;              // "cn" | "us" | "au" | "sg" | "eu"
  primaryLaw: string;          // "PIPL" | "COPPA" | "Privacy-Act-1988" | ...
  consentRequired: {
    recording: boolean;        // CN: false by default; COPPA: true
    sharing: boolean;
    analytics: boolean;
    aiTraining: boolean;       // CN: required explicit opt-out
  };
  dataResidency: {
    required: boolean;
    region: string;             // "cn" | "us" | "eu" | ...
  };
  minorProtection: {
    ageOfMajority: number;      // 18 (CN), 13 (COPPA), 16 (GDPR-K)
    parentalConsent: boolean;  // always true for <18
    schoolRecordOptIn?: boolean;  // FERPA-specific
  };
  // Specific clauses
  clauses: ComplianceClause[];
}

interface ComplianceClause {
  id: string;
  title: string;
  required: boolean;
  version: string;
  url: string;
  acceptedAt?: number;         // per-user acceptance
}

interface OnboardingStep {
  id: string;
  title: string;
  required: boolean;
  type: "form" | "select" | "consent" | "channel_bind" | "assessment";
  // Step-specific config
  config: Record<string, unknown>;
}

interface PricingConfig {
  currency: string;            // "CNY" | "USD" | "SGD" | "EUR" | ...
  freeTrialDays: number;
  plans: PricingPlan[];
  // Per-region payment methods
  paymentMethods: ("wechat_pay" | "alipay" | "stripe" | "paypal")[];
}

interface PricingPlan {
  id: string;                  // "solo" | "family" | "annual"
  name: string;
  pricePerMonth: number;       // in minor units (cents / fen)
  currency: string;
  features: string[];           // feature ids
  familyLimit?: number;         // for family plan
}
```

### 2.2 Example Region Configs

**`regions/cn/config.json`** (China):
```json
{
  "region": "cn",
  "displayName": "中国大陆",
  "defaultLocale": "zh-CN",
  "supportedLocales": ["zh-CN"],
  "personas": {
    "mentors": [
      {
        "id": "cn-mentor-nunu",
        "role": "mentor",
        "name": "小诺姐姐",
        "persona": "温柔的小学老师。先问你怎么想，再引导思路。...",
        "voiceConfig": { "provider": "minimax", "voiceId": "female-warm", "emotion": "warm", "pace": "medium", "language": "zh-CN" },
        "avatarPath": "/avatars/cn/nunu.png",
        "color": "#722ed1",
        "isTemplate": true
      },
      // 4-9 more mentor templates
    ],
    "buddies": [
      {
        "id": "cn-buddy-hongbj",
        "role": "buddy",
        "name": "小红",
        "persona": "爱提问的女生...",
        "voiceConfig": { "provider": "minimax", "voiceId": "girl-curious" },
        "avatarPath": "/avatars/cn/hong.png",
        "color": "#ec4899",
        "region": { "city": "北京", "country": "中国" },
        "isTemplate": true
      },
      {
        "id": "cn-buddy-liangsh",
        "role": "buddy",
        "name": "小亮",
        "region": { "city": "上海", "country": "中国" },
        "isTemplate": true
      },
      // 1-2 more buddies
    ],
    "parentAssistants": [{ "id": "cn-pa-01", "role": "parent_assistant", "name": "小助理", "isTemplate": true }]
  },
  "textbooks": [
    { "id": "renjiaoban-math-g4", "name": "人教版 4 年级数学", "version": "2024-edition", "subject": "math", "grade": 4, "chapterSchema": "chapter_code", "chapters": [...], "uploadedBy": "op-001", "uploadedAt": 1724000000000 }
  ],
  "channels": [
    {
      "channel": "wechat_miniapp",
      "enabled": true,
      "config": { "miniProgramId": "wx_xxxxxxxx", "templateIds": ["daily_v3", "weekly_v1"] },
      "defaultFrequency": "biweekly",
      "defaultTime": "21:00"
    },
    {
      "channel": "wechat_official",
      "enabled": true,
      "config": { "appId": "wx_xxxxxxxx", "templateIds": ["service_daily_v1"] },
      "defaultFrequency": "weekly",
      "defaultTime": "21:00"
    }
  ],
  "compliance": {
    "region": "cn",
    "primaryLaw": "PIPL",
    "consentRequired": { "recording": false, "sharing": true, "analytics": true, "aiTraining": true },
    "dataResidency": { "required": true, "region": "cn" },
    "minorProtection": { "ageOfMajority": 18, "parentalConsent": true }
  },
  "onboarding": [
    { "id": "register", "title": "家长注册 + 选套餐", "required": true, "type": "form", "config": {} },
    { "id": "add-child", "title": "绑定孩子", "required": true, "type": "form", "config": { "fields": ["name", "nickname", "grade", "textbook_id"] } },
    { "id": "pick-mentor", "title": "选择班主任模板", "required": true, "type": "select", "config": { "from": "personas.mentors" } },
    { "id": "pick-buddies", "title": "选择 2 个同学", "required": true, "type": "select", "config": { "from": "personas.buddies", "min": 2, "max": 2 } },
    { "id": "bind-wechat", "title": "绑定微信小程序", "required": true, "type": "channel_bind", "config": { "channel": "wechat_miniapp" } },
    { "id": "first-session", "title": "首次进教室", "required": true, "type": "assessment", "config": { "questions": 10 } }
  ],
  "pricing": {
    "currency": "CNY",
    "freeTrialDays": 30,
    "plans": [
      { "id": "solo", "name": "单孩", "pricePerMonth": 9900, "currency": "CNY", "features": ["1-child", "wechat-push"], "familyLimit": 1 },
      { "id": "family", "name": "家庭", "pricePerMonth": 19900, "currency": "CNY", "features": ["3-children", "wechat-push"], "familyLimit": 3 }
    ],
    "paymentMethods": ["wechat_pay", "alipay"]
  },
  "palette": {
    "primary": "#722ed1",
    "background": "#faf9fe",
    "surface": "#ffffff"
  },
  "features": {
    "classroomRecording": true,
    "momentsShare": true,
    "speechEvaluation": false,
    "mapTestPrep": false
  },
  "i18n": { "zh-CN": "i18n/zh-CN.json" }
}
```

**`regions/us-tx/config.json`** (US Texas home school):
```json
{
  "region": "us-tx",
  "displayName": "United States (Texas)",
  "defaultLocale": "en-US",
  "supportedLocales": ["en-US", "es-US"],
  "personas": {
    "mentors": [
      {
        "id": "us-mentor-maple",
        "role": "mentor",
        "name": "Ms. Maple",
        "persona": "Warm Charlotte Mason guide. Believes every child can love learning...",
        "voiceConfig": { "provider": "minimax", "voiceId": "female-warm-en", "emotion": "warm", "pace": "medium", "language": "en-US" },
        "avatarPath": "/avatars/us/maple.png",
        "color": "#b8763e",
        "promptOverride": "You are a warm homeschool mentor...",
        "isTemplate": true
      }
    ],
    "buddies": [
      {
        "id": "us-buddy-emma",
        "role": "buddy",
        "name": "Emma",
        "region": { "city": "Brooklyn", "country": "US" },
        "isTemplate": true
      },
      {
        "id": "us-buddy-noah",
        "role": "buddy",
        "name": "Noah",
        "region": { "city": "San Diego", "country": "US" },
        "isTemplate": true
      }
    ]
  },
  "textbooks": [
    { "id": "cc-math-g4", "name": "Common Core Grade 4 Math", "version": "CCSS-2024", "subject": "math", "grade": 4, "chapterSchema": "standard_code", "standards": [{ "code": "4.NF.A.1", "title": "Explain why fractions are equivalent", "concepts": [...] }], "uploadedBy": "op-002", "uploadedAt": 1724000000000 }
  ],
  "channels": [
    {
      "channel": "email",
      "enabled": true,
      "config": { "provider": "resend", "fromAddress": "digest@openmaic.app" },
      "defaultFrequency": "weekly",
      "defaultTime": "19:00"
    },
    {
      "channel": "whatsapp",
      "enabled": true,
      "config": { "businessAccountId": "wa_xxx", "templateName": "learning_daily_v3", "languageCode": "en" },
      "defaultFrequency": "daily",
      "defaultTime": "20:00"
    },
    {
      "channel": "sms",
      "enabled": true,
      "config": { "fromNumber": "+15555550100" },
      "defaultFrequency": "off",
      "defaultTime": "20:00"
    }
  ],
  "compliance": {
    "region": "us",
    "primaryLaw": "COPPA + FERPA",
    "consentRequired": { "recording": true, "sharing": true, "analytics": false, "aiTraining": false },
    "dataResidency": { "required": false, "region": "us" },
    "minorProtection": { "ageOfMajority": 13, "parentalConsent": true, "schoolRecordOptIn": false },
    "stateLaw": {
      "code": "TX",
      "name": "Texas Education Code §25.086 (home school)",
      "url": "https://statutes.capitol.texas.gov/Docs/ED/htm/ED.25.htm",
      "assessmentRequired": false
    }
  },
  "onboarding": [
    { "id": "register", "title": "Parent signup + plan", "required": true, "type": "form" },
    { "id": "add-child", "title": "Add child", "required": true, "type": "form" },
    { "id": "pick-mentor", "title": "Pick mentor template", "required": true, "type": "select" },
    { "id": "pick-buddies", "title": "Pick 2 study buddies", "required": true, "type": "select" },
    { "id": "bind-channels", "title": "Pick push channels (Email + WhatsApp)", "required": false, "type": "channel_bind" },
    { "id": "first-session", "title": "First mentor session", "required": true, "type": "assessment" }
  ],
  "pricing": {
    "currency": "USD",
    "freeTrialDays": 30,
    "plans": [
      { "id": "solo", "name": "Solo", "pricePerMonth": 1999, "currency": "USD", "features": ["1-child"], "familyLimit": 1 },
      { "id": "family", "name": "Family", "pricePerMonth": 3499, "currency": "USD", "features": ["3-children"], "familyLimit": 3 }
    ],
    "paymentMethods": ["stripe", "paypal"]
  },
  "palette": {
    "primary": "#b8763e",
    "background": "#fdf9f3",
    "surface": "#fdfbf6"
  },
  "features": {
    "classroomRecording": false,
    "momentsShare": false,
    "speechEvaluation": false,
    "mapTestPrep": true
  },
  "i18n": { "en-US": "i18n/en-US.json", "es-US": "i18n/es-US.json" }
}
```

---

## 3. Architecture

### 3.1 Layered Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  Presentation Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Next.js App   │  │ i18n runtime  │  │ Region picker│       │
│  │ (PWA)         │  │ (next-intl)   │  │ (first visit)│       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  Reads: regions/<region>/config.json → renders region-aware UI│
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Domain / Orchestration Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Companion     │  │ Director      │  │ Multi-agent  │       │
│  │ store         │  │ graph (LG)    │  │ runtime      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Error reasoner│  │ Spaced        │  │ Knowledge    │       │
│  │              │  │ repetition    │  │ graph        │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  Uses: PersonaRegistry (from regions/) + TextbookAdapter     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Abstractions Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Notification  │  │ Textbook      │  │ Compliance   │       │
│  │ Channel       │  │ Adapter       │  │ Guard         │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  Implementations live in regions/<region>/channels/         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
│  PostgreSQL · Redis · Object Storage · LLM Providers        │
│  WeChat Cloud · WhatsApp Business · SendGrid · Stripe · ...  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 PostgreSQL Schema (region-aware)

```sql
-- Users (real people)
users (
  id, role,                            -- student / parent / operator / admin
  email, phone, name, locale,          -- locale picked at signup (then validated against region)
  primary_region,                       -- FK to regions.region
  stripe_customer_id, wechat_openid,
  created_at
)

parent_student_bindings (
  id, parent_user_id, student_id,
  relationship, is_primary,
  permissions                          -- JSON: {see_portfolio, see_chat_summary, see_chat_full}
)

operator_region_assignments (
  id, operator_user_id, region,        -- which regions operator manages
  scope                                  -- read / write / push
)

-- Region config cached in DB (refreshed from regions/<region>/config.json)
region_configs (
  region, version,                      -- config version (operator edits bump)
  config_json,                          -- full region config
  published_at, published_by
)

-- Student-owned personas (cloned from region templates on onboarding)
persona_instances (
  id, student_id, region,              -- which region the template came from
  source_template_id,                   -- back-reference to region config
  role, name, persona, voice_config_json,
  avatar_path, color, priority,
  customized_fields_json,               -- parent tweaks
  is_active, created_at
)

-- Mistakes (textbook-versioned per region)
mistakes (
  id, student_id, region,
  question_text, question_image_url,
  user_answer, correct_answer,
  error_reason,                         -- concept_confusion / careless / ...
  chapter_code,                         -- region-aware: "4-NF-A-1" OR "4.NF.A.1"
  textbook_id, textbook_version,
  mastered_at, created_at
)

knowledge_points (
  id, region, subject, grade, textbook_id,
  chapter_code, name, parent_chapter_code
)

student_knowledge (
  student_id, knowledge_point_id,
  mastery_score, last_updated_at, evidence_count
)

-- Channel subscriptions (multi-channel per parent)
channel_subscriptions (
  id, parent_user_id, student_id, region,
  channel,                              -- wechat_miniapp / email / whatsapp / sms
  template_id, frequency, push_time,    -- local time
  timezone, enabled, created_at
)

-- Audit + billing
audit_logs (id, actor_user_id, action, target_type, target_id, region, ip, user_agent, created_at)
subscriptions (id, user_id, region, stripe_subscription_id, plan, status, current_period_end, created_at)
```

### 3.3 Region Resolution Flow

```
User visits https://openmaic.app
   ↓
Region picker (first visit):
  - Auto-detect via IP geolocation → suggest region
  - User confirms / picks different region
   ↓
Server resolves:
  - regions.get(region) → load config.json
  - regions.get(region).compliance → check minorProtection
  - If < ageOfMajority: enforce parentalConsent flow
   ↓
Client loads:
  - i18n bundle (defaultLocale)
  - Persona templates (personas.mentors / buddies)
  - Channels (channels[].channel where enabled)
  - Onboarding steps (onboarding[])
  - Palette (palette override)
  - Pricing (pricing.plans)
   ↓
App renders region-aware UI
```

---

## 4. Functional Modules (region-aware)

### 4.1 Persona Registry (region-scoped)

```ts
// lib/companion-core/personas/registry.ts
interface PersonaRegistry {
  listMentors(region: string): PersonaTemplate[];
  listBuddies(region: string): PersonaTemplate[];
  listParentAssistants(region: string): PersonaTemplate[];
  getTemplate(region: string, templateId: string): PersonaTemplate | null;
  cloneForStudent(studentId: string, templateId: string, tweaks: object): PersonaInstance;
}
```

**Onboarding**:
1. User picks region → server loads `regions/<region>/config.json`
2. `PersonaRegistry.listMentors(region)` → render mentor cards
3. User picks mentor → `cloneForStudent(studentId, mentorId, {})`
4. Repeat for 2 buddies
5. Server clones template → creates `persona_instances` row
6. Future: parent can tweak via `updateInstance(studentId, instanceId, {name, persona})`

### 4.2 Socratic Prompt Engine (template-driven)

```ts
// lib/companion-core/prompts/socratic.ts
interface SocraticEngine {
  buildPrompt(region: string, role: "mentor" | "buddy", personaInstance: PersonaInstance): string;
}

function buildPrompt(region: string, role: string, instance: PersonaInstance): string {
  const template = loadTemplate(`regions/${region}/prompts/${role}.md`);
  return template
    .replace("{{persona.name}}", instance.name)
    .replace("{{persona.persona}}", instance.persona)
    .replace("{{language}}", instance.voiceConfig.language)
    // ...
    ;
}
```

**Region-specific prompt templates**:
- `regions/cn/prompts/mentor.md` — "你是一个温柔的小学老师..."（中文 Socratic）
- `regions/us-tx/prompts/mentor.md` — "You are a warm homeschool mentor..."（英文 + Charlotte Mason spirit）

**Generic Socratic rules** (same across regions):
1. Never give answers directly
2. Always ask "What do you think?" first
3. One-line hint if needed
4. Break into 3-5 reasoning steps if truly stuck
5. Mistakes are not failures — ask "Why this approach?"
6. Correct answer → brief affirmation + push deeper
7. Mood detection: 2 wrong in a row → encouraging tone
8. **Memory isolation: only know THIS student**

### 4.3 Textbook Adapter (region-config-driven)

```ts
// lib/companion-core/textbooks/adapter.ts
interface TextbookAdapter {
  // List available textbooks for region
  listTextbooks(region: string, grade: number, subject: string): TextbookAdapter[];
  // Get specific textbook
  getTextbook(textbookId: string): TextbookAdapter;
  // Resolve chapter code → concept name + parent concept
  resolveChapter(textbookId: string, code: string): Chapter | null;
  // List all chapters (for graph rendering)
  listChapters(textbookId: string): Chapter[];
}
```

**Implementations**:
- `ChapterCodeAdapter` — for Chinese textbooks (人教版 4-NF-A-1 style)
- `StandardCodeAdapter` — for Common Core (4.NF.A.1 style)
- Future: `SingaporeMathAdapter`, `UKNationalAdapter`

Each region picks its adapter based on textbook `chapterSchema` field.

### 4.4 Notification Channels (region-pluggable)

```ts
// lib/companion-core/notifications/channel.ts
interface NotificationChannel {
  send(payload: NotificationPayload): Promise<SendResult>;
}

interface NotificationPayload {
  parentUserId: string;
  studentId: string;
  templateId: string;
  data: Record<string, unknown>;        // template variables
  region: string;
  locale: string;
}

interface ChannelRegistry {
  // Get channels enabled for a region
  getEnabledChannels(region: string): NotificationChannel[];
  // Send via all subscribed channels for a parent
  sendToParent(payload: NotificationPayload): Promise<SendResult[]>;
}
```

**Implementations** (per region):
- `WeChatMiniAppChannel` (CN)
- `WeChatOfficialChannel` (CN)
- `EmailChannel` (US, EU, AU, SG)
- `WhatsAppBusinessChannel` (US, LATAM, EU, SEA)
- `SmsChannel` (fallback everywhere)
- `PushChannel` (mobile)

**Region's enabled channels** = filter from `regions/<region>/channels[]` where `enabled: true`.

### 4.5 Compliance Guard (region-routed middleware)

```ts
// lib/companion-core/compliance/guard.ts
interface ComplianceGuard {
  checkConsent(userId: string, action: ConsentAction): Promise<ConsentResult>;
  requireDataResidency(data: object, region: string): void;
  logAuditEvent(actorId: string, action: string, target: object): void;
}

type ConsentAction = "recording" | "sharing" | "analytics" | "ai_training";
```

**Implementations**:
- `ChinaComplianceGuard` — PIPL + 未成年人保护法 + data residency cn
- `CoppaFerpaGuard` — US (COPPA + FERPA + state laws)
- `AuPrivacyGuard` — Australia Privacy Act 1988
- `EuGdprGuard` — GDPR-K
- `SingaporePdpaGuard` — Singapore PDPA

**Region's guard** = look up `regions/<region>/compliance.primaryLaw`.

### 4.6 Onboarding (region-driven step list)

```ts
// lib/companion-core/onboarding/flow.ts
interface OnboardingFlow {
  getSteps(region: string): OnboardingStep[];
  validateStep(stepId: string, payload: object, region: string): ValidationResult;
  completeStep(userId: string, stepId: string, payload: object): Promise<void>;
}
```

**Steps come from** `regions/<region>/onboarding[]` — operator can add/remove/reorder.

**Default step types**:
- `form` — generic form fields
- `select` — pick from list (mentor / buddy / channel / textbook)
- `consent` — accept privacy/terms clauses
- `channel_bind` — bind push channel (WeChat scan / WhatsApp opt-in / Email verify)
- `assessment` — onboarding evaluation (10 questions)

### 4.7 Push Digest Pipeline (region-aware)

```
End of lesson (or weekly cron)
  ↓
Aggregate student daily/weekly report
  ↓
For each parent:
  - Look up region
  - Look up enabled channels
  - Look up parent's channel_subscriptions (which channels they enabled)
  - For each subscribed channel:
    - Render template (region-aware: e.g., WeChat uses template_id; Email uses HTML)
    - Send
  ↓
Track delivery + read receipts (region-specific APIs)
```

### 4.8 Classroom Recording (region-feature-flag)

`features.classroomRecording: true` only in some regions (e.g., CN enabled, US disabled initially).

**If enabled**:
- Onboarding step `recording_consent` (CN: explicit per PIPL)
- Post-lesson render job → HLS stream
- Storage in region-required data residency
- Watermark + AI disclosure per local law
- Region-specific sharing channels (CN: WeChat moments; US: WhatsApp if enabled)

### 4.9 Admin Console

**Region config management**:
- Operator with `write` scope on region can edit `regions/<region>/config.json`
- Versioned commits (region_configs table + `published_at` / `published_by`)
- Preview before publish (test mode)
- Rollback to previous version

**Operator workflows**:
1. **Upload textbook**: PDF / Excel → parser → generates chapter structure → save to region.textbooks
2. **Create persona template**: write persona + select voice + upload avatar → save to region.personas.{mentors|buddies}
3. **Configure channel**: enable/disable, set template IDs, default frequency → save to region.channels
4. **Set compliance**: select primary law, consent defaults, data residency → save to region.compliance
5. **Edit onboarding**: add/remove/reorder steps → save to region.onboarding
6. **Set pricing**: plans + payment methods → save to region.pricing
7. **Configure features**: enable classroom recording / speech evaluation / etc → save to region.features
8. **i18n strings**: edit locale bundles → save to region.i18n

### 4.10 Error Handling (universal + region-specific)

| Scenario | Handling |
|---|---|
| LLM response timeout | Retry 1× + "Mentor thinking..." placeholder + fallback text |
| LLM invalid action type | Storage sanitizer (commit 423b86b1) |
| Channel send failure | Retry per-channel 3×; log; queue for next cron |
| WhatsApp rate limit (24h/1 template) | Queue; spread across day |
| Email bounce | Disable channel subscription for parent; notify operator |
| Parent unsubscribes | channel_subscriptions.enabled = false |
| Photo OCR failure | Prompt retake with lighting/angle tips |
| Error reasoner uncertain | Tag "needs human review", default "other" |
| **Cross-student persona memory leak** | **audit_logs alert + immediate session freeze** |
| **Compliance violation attempt** | **ComplianceGuard denies + audit_log + notify admin** |
| Region config not found | Fallback to nearest region by locale; or block signup |
| Textbook not in region | Fallback to next textbook with same subject/grade |
| Persona template deprecated | Block new clone; show "this template is no longer available" |
| Channel not configured (e.g., WeChat in US-TX) | Hide channel from parent UI; don't break |

---

## 5. Testing & Acceptance

### 5.1 Unit Tests

- Region config schema validation (per region)
- PersonaRegistry (list, clone, tweak)
- SocraticEngine (region-aware prompt building)
- TextbookAdapter (chapter_code vs standard_code)
- NotificationChannel per implementation
- ComplianceGuard per region
- OnboardingFlow (region step list)
- ChannelRegistry (parent's subscribed channels)
- Storage sanitizer (commit 423b86b1)
- Error reasoner (5 categories)

### 5.2 Integration Tests

- Full onboarding flow per region (CN: 6 steps; US-TX: 5 steps)
- Push via each channel × each region
- Persona clone chain (template → instance)
- Cross-region isolation (CN student shouldn't be in US digest)
- Region config update propagation (publish → cache invalidation → UI refresh)

### 5.3 E2E (Playwright)

- New parent in CN: signup → add child → pick mentor/buddies → bind WeChat → first lesson
- New parent in US-TX: signup → add child → pick mentor/buddies → bind Email + WhatsApp → first lesson
- Operator: edit CN region config → upload textbook → enable classroom recording
- Compliance: minor in COPPA region tries to skip consent → blocked + audit

### 5.4 Business Metrics

| Metric | Per-Region Target | Notes |
|---|---|---|
| 7-day retention | CN ≥ 40% / US-TX ≥ 50% / SG ≥ 35% / EU ≥ 30% | Region-dependent |
| Daily time | 15-30 min | Universal |
| Push open rate | CN WeChat ≥ 60% / US Email ≥ 65% / US WhatsApp ≥ 80% | Channel-dependent |
| Trial → paid | ≥ 25% | Universal |
| NPS | ≥ 40 | Universal |
| Persona template usage | All regions have ≥ 5 mentor templates uploaded | Operator KPI |
| Textbook coverage | Each grade × subject has ≥ 1 textbook | Operator KPI |
| Compliance violations | 0 (hard) | All regions |
| Cross-region data leak | 0 (hard) | All regions |

### 5.5 Performance Targets (universal)

- LLM response latency: p95 ≤ 8s (all regions)
- Push delivery: p95 ≤ 30s (all channels)
- Page load: LCP ≤ 2.5s (region-aware CDN)
- Region picker: ≤ 100ms (cached configs)

---

## 6. Work Phasing

### Phase 0: Already shipped (OpenMAIC existing)
- Multi-agent / chat runtime / agent registry / TTS / voice / document store
- Storage sanitizer (commit 423b86b1)

### Phase 1: MVP — CN + US-TX (parallel, 4 weeks, 2-3 people)

**Goal**: 2 regions (CN + US-TX) running in production with end-to-end flow.

| Module | Days | Notes |
|---|---|---|
| Region config schema + loader | 3 days | JSON schema + validator + cache |
| PersonaRegistry + clone chain | 3 days | Template → instance |
| SocraticEngine + region-aware prompts | 4 days | 2 prompt templates (CN + US) |
| TextbookAdapter (chapter_code + standard_code) | 4 days | 2 textbook types |
| OnboardingFlow (region-driven) | 4 days | CN 6 steps + US 5 steps |
| NotificationChannel abstraction + 4 impls | 5 days | WeChat mini-app + WeChat official + Email + WhatsApp |
| ComplianceGuard + 2 impls | 3 days | PIPL + COPPA/FERPA |
| ChannelSubscription manager | 3 days | Parent picks channels per region |
| Error reasoner (5 categories) | 1 week | Universal |
| Knowledge graph (textbook-versioned) | 3 days | Universal |
| Spaced repetition review mode | 4 days | Universal |
| Pomodoro mode | 2 days | Universal (region-configurable duration) |
| Parent dashboard MVP | 1 week | Universal; channel-specific cards |
| Admin console (region config editor) | 1.5 weeks | Big — operator's main tool |
| Stripe + WeChat Pay integration | 4 days | Universal with region config |
| RBAC + audit_logs (cross-region) | 3 days | Universal |
| UI: region picker + i18n + palette | 1 week | Universal; per-region values |

### Phase 2: Polish + more regions (4 weeks, 2-3 people)

| Module | Days |
|---|---|
| AU-NSW + SG regions (English-speaking) | 1 week |
| EU-DE region (GDPR-K) | 1 week |
| Auto-textbook upload (PDF parser → chapter extraction) | 2 weeks |
| Persona auto-generation (LLM scaffolds from "tutor for 4-year-old math") | 1.5 weeks |
| i18n platform (translate UI strings via crowd-sourcing or LLM) | 1.5 weeks |
| Mobile push (iOS/Android native apps) | 3 weeks |

### Phase 3: Advanced features (4 weeks, 2-3 people)

| Module | Days |
|---|---|
| Classroom recording (CN-focused initially) | 2 weeks |
| Speech evaluation (pronunciation + fluency) | 2 weeks |
| MAP / Iowa / state-specific test prep | 1.5 weeks |
| Cross-region co-op matching (real home school buddies across regions) | 2 weeks |
| Mentor persona growth (parent feedback evolves personality) | 2 weeks |
| Mood detection (frustration / boredom / engaged, intensity) | 2 weeks |

### Phase 4: Scale (ongoing)

- More regions (LATAM, Africa, more EU)
- Vertical integration (school partnerships)
- Marketplace for third-party persona templates
- API for LMS integration

---

## 7. Risks & Dependencies

| Risk | Impact | Mitigation |
|---|---|---|
| Region config drift (operator edits break schema) | Universal | Schema validation + preview mode + rollback |
| Cross-region data leak | Fatal | RBAC + audit_logs + 0-tolerance test |
| Persona template quality varies by operator | Region trust | Quality metrics dashboard; flag low-usage templates |
| Textbook parser accuracy | Region-specific UX | Manual review workflow; fallback to known publishers |
| Channel send failure rate varies by region | Parent experience | Per-channel retry + fallback (e.g., WeChat → Email) |
| Compliance interpretation errors (especially new laws) | Legal | Legal review per region; templates from compliance team |
| LLM cost scales with regions (more templates = more cache misses) | Cost | Aggressive caching + prompt compression |
| Voice cloning regulation varies (US vs EU) | Feature gating | Per-region features.classroomRecording + voice clone consent |
| Regional pricing parity (CN ¥ vs US $) | Conversion | Localized pricing config; A/B test |
| Operator overload (managing 5+ regions) | Ops cost | Admin tooling improvements; eventual AI-assisted config |

### External Dependencies

- **LLM providers**: MiniMax (configured) + OpenAI / Anthropic fallback
- **TTS providers**: MiniMax + ElevenLabs + Azure
- **Push channels**:
  - WeChat mini-program (appid, secret, long-term subscription template)
  - WhatsApp Business Cloud API (Meta pre-approval)
  - SendGrid / Resend (email)
  - Twilio (SMS)
- **Payments**: WeChat Pay / Alipay (CN) + Stripe (global) + PayPal (fallback)
- **Storage**: S3-compatible (AWS S3 / Aliyun OSS / Tencent COS per region)
- **PostgreSQL**: production deployment
- **Compliance templates**: PIPL / COPPA / FERPA / GDPR-K / Privacy Act 1988 / PDPA — need legal review per region

---

## 8. Adding a New Region (operational guide)

This section is for operators adding new regions.

### 8.1 Checklist

1. **Legal review** for target region's data protection + minor protection laws
2. **Pricing research**: local purchasing power, competitor pricing, payment methods
3. **Textbook partnerships**: license content from local publishers, or upload public-domain (e.g., US Common Core)
4. **Persona localization**: write 5-10 mentor templates + 3-5 buddy templates with local cultural references (names, cities, idioms)
5. **Channel setup**: enable channels that work locally (e.g., CN WeChat; US Email + WhatsApp; SEA WhatsApp)
6. **Voice selection**: pick TTS voices matching local language (e.g., zh-CN MiniMax voice, en-US MiniMax voice)
7. **Payment integration**: enable local payment methods
8. **i18n bundle**: translate UI strings
9. **Test plan**: run E2E per region
10. **Launch**: enable region in picker

### 8.2 Time Estimate

A new region takes ~2-3 weeks with all of the above (assuming textbook partnership already done).

---

## 9. Migration Path (from old cn-companion + intl-companion)

If you have code in `apps/cn-companion/` or `apps/intl-companion/` from the previous split:

1. **Extract common code** → `lib/companion-core/`
2. **Move region-specific code** → `apps/companion/regions/<region>/`
3. **Replace hardcoded product differences** → load from region config
4. **Delete `apps/cn-companion/` and `apps/intl-companion/`**
5. **Rename product flag** from `NEXT_PUBLIC_COMPANION_CN` / `_INTL` → single `NEXT_PUBLIC_COMPANION` enabled, region picked at runtime

---

## 10. Appendix

### 10.1 File Structure

```
specs/companion.md           ← this file (canonical)
apps/companion/
├── README.md
├── SPEC.md                  ← copy of canonical
└── regions/
    ├── cn/config.json
    ├── us-tx/config.json
    ├── au-nsw/config.json
    ├── sg/config.json
    └── eu-de/config.json

mockups/
├── region-picker.html       ← first-launch region select
├── admin-region-config.html ← operator configures regions
├── classroom-layout-c3.html  ← universal classroom
├── student-home.html         ← universal student home
├── admin-console.html        ← universal admin console
├── wechat-push.html           ← CN-flavored push
├── whatsapp-push.html         ← INTL-flavored push
├── cn-parent-recording.html   ← CN region feature
├── cn-wechat-moments-share.html ← CN region feature
├── home-school-classroom.html ← INTL region flavor
└── home-school-parent-dashboard.html ← INTL region flavor
```

### 10.2 Related Specs

- `specs/companion.md` (this) — single product, region-driven

### 10.3 Commit Reference

- `423b86b1` — fix(storage): storage sanitizer for chat-shape actions
