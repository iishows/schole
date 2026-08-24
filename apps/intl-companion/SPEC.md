# OpenMAIC Companion Classroom · International Spec (Home School)

**Date**: 2026-08-25
**Status**: Draft · Pending review
**Companion**: China variant see `2026-08-25-companion-cn.md`

---

## 1. Overview

### 1.1 Product Positioning

Evolve OpenMAIC from "AI classroom generator" to "after-school companion learning product." Primary market: **US / Canada / Australia home school families**, K-5 (ages 5-10). Mentor + 2 study buddies (cross-cohort, regional) companion the child during lessons; parents get daily digest via Email + optional WhatsApp.

### 1.2 Target Users

- **Student**: K-5 (ages 5-10), home schooled, Common Core / Charlotte Mason / Singapore Math
- **Parent**: Home school primary teacher, 30-45 yo, English-speaking, US/CA/AU/SEA expat
- **Operator / Content curator**: PC Web admin console (multi-student, multi-region)

### 1.3 Core Pain Points

| Role | Pain | Solution |
|---|---|---|
| Student | No peers, no teacher always available | AI mentor + regional study buddies (cross-cohort feel) |
| Parent | Can't teach every subject (esp. math/science); record-keeping burden | AI mentor as teaching assistant; auto weekly portfolio |
| Family | Socialization gap (#1 home school anxiety) | AI study buddies from other states/countries |

### 1.4 Design Decisions

| Decision | Options | Choice | Reason |
|---|---|---|---|
| Classroom layout | C1/C2/C3 | **C3 floating bubbles + compact input** | Real classroom feel, not chat |
| "Real person" | Single teacher / multi-agent | **Mentor + 2 study buddies + parent assistant** | Multi-agent already built; differentiates |
| MVP scope | A:1-2w / B:3-4w / C:8-12w | **B core MVP (4w)** | Loop closed + companion feel + portfolio |
| Student entry | Browse / continue | **Continue (hero CTA)** | Zero thought entry |
| Chat position | Bottom / right-bottom / floating | **Floating bubbles + history drawer** | Real classroom |
| Parent channel | Web / mini-program / newsletter | **Web dashboard + Email digest + optional WhatsApp** | No app install; WhatsApp for LATAM/EU/SEA |
| Push frequency | Daily / weekly | **Weekly default (Sun 7pm local) + daily WhatsApp opt-in** | Anti-spam |
| Data storage | Client-only / server | **Server PostgreSQL + client cache** | Cross-device sync |
| **Persona creation** | A platform templates / B LLM-generated / C templates + tweak | **C templates + tweak** | Quality + personalization |
| **Parent tweaks mentor persona** | Yes / No | **Yes** (name + personality detail + voice) | Parental control over their child's tutor |
| **Mentor memory isolation** | Strict / shared | **Strict per-student** | Legal (COPPA/GDPR-K) + safety |
| **Parent sees mentor full chat** | Summary / full | **Default summary + on-demand full** | Privacy-by-default |
| **Operator RBAC** | Global / per-class | **Per-class assignment** | Data minimization |

### 1.5 Mockup Files

- `mockups/home-school-classroom.html` — Student view (mentor + buddies, regional co-op)
- `mockups/home-school-parent-dashboard.html` — Parent Web dashboard
- `mockups/home-school-onboarding.html` — Onboarding step 3/5 (mentor + buddies + WhatsApp opt-in)
- `mockups/whatsapp-push.html` — WhatsApp Business API push template

---

## 2. Architecture

### 2.1 Module Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                 Student App (Next.js PWA, English UI)           │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ Classroom (C3)    │  │ Student Home      │                     │
│  │ Slate + desks     │  │ Continue CTA +    │                     │
│  │ + bubbles         │  │ Weekly Portfolio  │                     │
│  └──────────────────┘  └──────────────────┘                     │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ State (Zustand)                                       │       │
│  │  • stage store (existing)                             │       │
│  │  • companion store (mentor/buddies/parent assistant)│       │
│  │  • portfolio store (Charlotte Mason record-keeping)   │       │
│  │  • knowledge graph store (Common Core standards)      │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / SSE
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  OpenMAIC Server (Next.js API + workers)        │
│  ┌─ Existing ──────────────────┐  ┌─ New ──────────────────┐    │
│  │ • outline / scene generation │  │ • Companion director    │    │
│  │ • chat runtime                │  │ • Error reasoner        │    │
│  │ • agent registry              │  │ • Knowledge graph svc   │    │
│  │ • tts / voice                 │  │ • Push channel layer    │    │
│  │ • document store              │  │   (Email/WhatsApp/SMS)  │    │
│  └──────────────────────────────┘  │ • RBAC middleware       │    │
│                                    │ • Stripe billing        │    │
│                                    └─────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├──→ Email (SendGrid/Resend)
                              ├──→ WhatsApp Business Cloud API
                              └──→ Twilio SMS
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                Parent Web Dashboard (Next.js)                  │
│  • Weekly Portfolio  • Common Core Progress  • MAP Prep         │
│  • Push channel picker  • Mentor chat summary + on-demand full   │
│  • Stripe subscription management                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                Admin Console (PC Web, Next.js)                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 PostgreSQL Schema (key tables)

```sql
-- Student profile
students (
  id, name, nickname, grade,
  textbook_version,              -- Common Core / Charlotte Mason / Singapore Math / Singapore UK
  region_code,                    -- US-TX, US-CA, AU-NSW, SG, ...
  homeschool_style,               -- charlotte_mason / classical / eclectic
  weekly_schedule_json,           -- {mon: 60min, tue: 45min, ...}
  settings_json, created_at, updated_at
)

-- Real users (parents / operators / admins)
users (
  id, role,                       -- parent / operator / admin
  email, phone, name,
  region_code, timezone,           -- for push timing
  stripe_customer_id, locale,
  created_at
)

-- Parent-Student binding (multi: parents + grandparents)
parent_student_bindings (
  id, parent_user_id, student_id,
  relationship,                   -- mother / father / grandparent / tutor
  is_primary,                    -- primary push recipient
  permissions                     -- JSON: {see_portfolio, see_chat_summary, see_chat_full}
)

-- Operator-class assignment (RBAC)
operator_class_assignments (
  id, operator_user_id, class_id,
  scope                            -- read / write / push
)

-- AI personas (owner model — see Section 3.2)
ai_personas (
  id, owner_type,                  -- student / parent / platform
  owner_id,                        -- user_id or NULL (platform)
  role,                            -- mentor / buddy / parent_assistant / template
  name, persona, voice_config_json,
  avatar_path, color, priority,
  is_template,                     -- TRUE for platform templates
  source_template_id,              -- clone chain
  region_code,                     -- for regional buddies (Emma in NY)
  created_at
)

student_persona_instances (
  id, student_id, ai_persona_id,
  customized_fields_json,          -- parent tweaks
  created_at
)

-- Mistakes (per-student, per-textbook)
mistakes (
  id, student_id, question_text, question_image_url,
  user_answer, correct_answer,
  error_reason,                    -- fraction_concept / careless / unit_confusion / ...
  standard_code,                   -- Common Core: "4.NF.A.1"
  textbook_version, mastered_at,
  created_at
)

-- Knowledge points (Common Core standards)
knowledge_points (
  id, subject, grade, textbook_version,
  standard_code, name, parent_standard_code
)

student_knowledge (
  student_id, knowledge_point_id,
  mastery_score, last_updated_at, evidence_count
)

-- Portfolio entries (Charlotte Mason record-keeping)
portfolio_entries (
  id, student_id, week_start, week_end,
  week_summary,                    -- LLM-generated weekly recap
  standards_covered_json,
  mentor_sessions_count,
  buddy_interactions_count,
  reading_list_json,
  parent_notes, exported_pdf_url
)

-- Push subscriptions (multi-channel)
push_subscriptions (
  id, parent_user_id, student_id,
  channel,                         -- email / whatsapp / sms
  template_id, frequency, push_time, timezone,
  enabled, created_at
)

-- Stripe billing
subscriptions (
  id, user_id, stripe_subscription_id, plan, status,
  current_period_end, created_at
)

-- Audit logs (compliance)
audit_logs (
  id, actor_user_id, action, target_type, target_id,
  ip, user_agent, created_at
)
```

### 2.3 Critical Data Flow: Companion Session

```
Student taps "Continue last lesson" on home
   ↓
Server: load student state
   - student_persona_instances (cloned mentor + 2 buddies, with parent tweaks)
   - portfolio (last week + this week in progress)
   - mistake book + knowledge graph
   - last session context
   ↓
Client renders C3 classroom
   - Slate with chalked text (animated)
   - 3 desks (Emma Brooklyn / Noah San Diego / me)
   - Floating bubbles initial state
   - Today's nature walk idea (Charlotte Mason banner)
   ↓
Student types question / raises hand
   ↓
Server: director picks next_agent
   - RBAC: mentor/buddy can only access THIS student's data
   - LLM call (MiniMax M3 or OpenAI fallback)
   - Streaming SSE: speech + white-board content
   ↓
Client streams
   - Bubble appears
   - Slate types letter-by-letter + cursor
   - Buddy avatar state change (hand / thinking / speaking)
   ↓
Student submits answer
   ↓
Server: grading
   - Correct → mastery +5, congratulations animation
   - Wrong → error reasoner → mistake book → mastery -10
   - Mood detection (frustration / boredom)
   ↓
Sunday 7pm cron (or daily if WhatsApp opt-in)
   - Aggregate weekly portfolio + daily highlights
   - Render Email template / WhatsApp template
   - Send via channel
   ↓
Parent receives → opens web dashboard
   - Reviews portfolio + Common Core progress
   - Reads mentor summary (default) or grants full-chat access
   - Sends note to mentor
   ↓
Next day mentor references parent's note, continues
```

---

## 3. Roles & Permissions (Core Architecture)

### 3.1 Role Inventory

**Real users (4)**:
- **Student** (user.role = student)
- **Parent** (user.role = parent) — also serves as primary home school teacher
- **Operator / Content curator** (user.role = operator)
- **Platform admin** (user.role = admin)

**Virtual personas (5)**:
- **Mentor** (role = mentor) — student-owned, **1-to-1**
- **Study Buddy** (role = buddy) — student-owned, **1 student : 2-3 buddies**
- **Parent Assistant** (role = parent_assistant) — parent-owned, 1-to-1
- **Persona Template** (role = template) — platform-owned, operator-editable
- **Operator Assistant** (role = operator_assistant) — v2+, platform-owned

### 3.2 Owner Model (Data Isolation)

| Persona | Type | Owner | Visible scope |
|---|---|---|---|
| Student mentor | Student-owned | This student | Only this student's conversation |
| Student buddy | Student-owned | This student | Only this student's conversation |
| Parent assistant | Parent-owned | This parent | Only this parent's conversation |
| Mentor template | Platform | NULL | All read-only (cloneable) |
| Buddy template | Platform | NULL | All read-only (cloneable) |

**Critical rules**:
- Student-owned personas are **strictly isolated**: if Emma mentions Lily in Lily's session, Emma **must never** mention Lily in Noah's session
- Templates are platform-owned; on user onboarding, system **clones** template → student-owned instance (original template preserved + parent-tweakable copy)
- Clone chain recorded via `source_template_id` field for traceability

### 3.3 Permission Matrix

| Action | Student | Parent | Operator | Admin |
|---|---|---|---|---|
| View own mistakes | ✅ write | ✅ view | ✅ their class | ✅ all |
| Edit mistake reason | ✅ mark mastered | ❌ | ✅ edit | ✅ |
| View other students' mistakes | ❌ | ❌ | ✅ their class | ✅ all |
| Chat with own mentor | ✅ | ❌ | ❌ | ❌ |
| View mentor full chat | ❌ | ✅ summary; **on-demand full** | ❌ | ❌ |
| Tweak own child's mentor persona | ❌ | ✅ (name + personality + voice) | ✅ templates | ✅ all |
| Create new mentor template | ❌ | ❌ | ✅ | ✅ |
| View mentor template library | ✅ browse | ✅ | ✅ edit | ✅ |
| Receive push digest | ❌ (study uninterrupted) | ✅ default | ✅ manual push | ✅ |
| Push parent digest | ❌ | ❌ | ✅ | ✅ |
| Cross-student mentor memory leak | ❌ | ❌ | ❌ | ❌ |
| Set learning time limit | ❌ | ✅ | ✅ their class | ✅ default |
| Pay / manage subscription | ❌ | ✅ | ❌ | ❌ |
| Switch push channel (Email/WhatsApp) | ❌ | ✅ | ❌ | ❌ |
| View audit logs | ❌ | ❌ | ✅ their actions | ✅ all |

### 3.4 Persona Creation Flow (User Onboarding)

```
[Step 1] Parent signs up + picks plan
   - Free trial (30 days) / Solo ($19.99/mo) / Family ($34.99/mo up to 3 kids)
   - Stripe checkout
   ↓
[Step 2] Add child
   - Name / nickname / grade / region / homeschool style / textbook version
   ↓
[Step 3] Pick mentor template (5-10 platform presets)
   - "Ms. Maple" (warm Charlotte Mason guide) — recommended
   - "Mr. Hawking" (rigorous science/math)
   - "Captain Vega" (energetic adventure-style)
   - ... (each with persona + voice + avatar + sample dialogue)
   ↓
[Step 4] Pick 2 study buddy templates
   - Curious type / Careful type / Careless type / Quiet type / ...
   - Regional auto-assigned based on parent's region:
     * parent in TX → Emma in Brooklyn / Noah in San Diego
     * parent in CA → Mia in Portland / Theo in Seattle
     * parent in AU → Olivia in Melbourne / Jack in Sydney
   - v1.1: renameable
   ↓
[Step 5] System auto-clones templates → student-owned instances
   - source_template_id chain recorded
   - Tweakable copies created
   ↓
[Step 6] Pick push channels (Email default + WhatsApp opt-in)
   - WhatsApp: enter phone → receive template message → confirm subscription
   ↓
[Step 7] Child's first session
   - Mentor welcome message (Charlotte Mason style: warm + nature observation)
   - Onboarding assessment (10 questions to set baseline mastery)
```

**v2 tweak UI** (v1.5+):
- Rename (e.g., "Ms. Maple" → "Auntie Maple")
- Adjust personality detail ("be a bit stricter")
- Pick voice variant (calm / energetic)
- Still constrained to template skeleton

---

## 4. Functional Modules

### 4.1 Student-Owned Persona System

**Mentor (fixed 1)**

- **Style selection**: 5-10 platform templates
  - Ms. Maple (warm Charlotte Mason guide, nature-loving)
  - Mr. Hawking (rigorous, math/science focus)
  - Captain Vega (adventure-style, energetic)
  - Miss Ada (literature-rich, slow-paced)
  - Coach Red (sports-motivator style)
  - ... (extensible)
- **Long-term memory**:
  - Student profile (grade / interests / temperament / recent school events)
  - Mistake book + error reasons
  - Common Core mastery
  - Mood history + notable quotes
- **Socratic prompt** (core):
  ```
  You are a warm homeschool mentor. Your student will ask homework questions.
  Strict rules:
  1. Never give answers directly
  2. Always ask "What do you think?" first
  3. One-line hint if needed
  4. If student truly stuck, break into 3-5 reasoning steps
  5. Mistakes are not failures — ask "Why did you choose this approach?"
  6. Correct answer → brief affirmation + push deeper ("What if the denominators were different?")
  7. Mood detection: 2 wrong answers in a row → switch to encouraging tone
  8. Memory isolation: you only know THIS student; never leak other students' info
  9. Charlotte Mason spirit: short lessons, nature observation, narration over drill
  ```

**Study Buddies (fixed 2-3)**

- **Templates**: 5-8 presets (Curious / Careful / Careless / Quiet / Energetic / ...)
- **Regional feel** (v1.1+): auto-assigned city + name based on parent's region
  - Real cities: Brooklyn / San Diego / Portland / Seattle / Boston / Austin / Melbourne / Sydney / Singapore / ...
  - v2+: parent can pick any combination
- **Personality fixed, but "grows"** — adapts interaction style based on child's feedback
- **Whisper visualization**: floating bubble + dotted connector (not consolidated bottom-right)
- **Trigger**: director probability inserts buddy comment after mentor speech (whisper / counterpoint / supplement)

**Parent Assistant** (separate channel)

- Separate system prompt
- **Does NOT speak in student chat** — only in parent web dashboard as "your assistant"
- Functions:
  - Explain how to teach a mistake
  - Pedagogical side suggestions (kid struggling with fractions? how to approach)
  - Compile kid's questions list + suggest topics for next tutor meeting

### 4.2 Lesson Mode (Core)

**Student entry**:
- Photo (OCR + LLM parse)
- Type problem
- Pick from mistake book
- Voice input

**AI tutoring flow**:
1. Student asks
2. AI doesn't answer: "What do you think?"
3. Student answers
4. Correct → affirm + push deeper (transfer learning)
5. Wrong → counter-question "Why this approach?" → student explains → identify error → guide correct reasoning
6. Truly stuck → step-by-step reasoning (3-5 steps)
7. Complete → auto-add to mistake book (tag error reason + **Common Core standard code**)
8. Error categories: concept_confusion / careless / unit_confusion / problem_misread / arithmetic_misc

**Error Reasoner Engine** (new module):
- Student wrong + student's explanation → LLM infers reason
- 5 categories + detailed text
- Same-reason items → grouped during review

### 4.3 Review Mode (Spaced Repetition)

**Algorithm**:
- New mistake: mastery 0%
- Review correct: mastery +20%, next interval per Ebbinghaus
- Review wrong: mastery -10%, next interval shorter
- Mastery 100% + 3 corrects → leave mistake book

**Daily review queue**:
- Home "📔 Today's Review" shows 3-5 items
- Sorted by "should review time" (oldest first)
- Review mode UI: single-item loop, no full mistake book

**Weekly Portfolio Card** (v1.1+):
- Home top +1 "This Week's Portfolio" card
- Shows: weekly problems / mistakes / standards covered / mentor sessions / reading list
- One-click to review

### 4.4 Pomodoro Mode

- **20-min lesson + 5-min break** (Charlotte Mason short-attention-span principle)
- Mentor checks in ("You've been at it 15 minutes — take a short break?")
- Parent-configurable daily limit (default 30min/day)
- Time over: prompt "Enough for today, continue tomorrow?"

### 4.5 Reading Practice (v2 scope)

- Word-by-word / sentence narration
- Speech evaluation: pronunciation accuracy + fluency
- Integration with OpenMAIC existing TTS

### 4.6 Knowledge Graph (Common Core)

**Schema**:
```ts
interface KnowledgePoint {
  id: string;             // e.g. "math.4.NF.A.1"
  subject: string;        // "math" | "ela" | "science" | "social"
  grade: number;
  textbookVersion: string; // "Common Core" | "Singapore Math" | "Singapore UK"
  standardCode: string;   // "4.NF.A.1"
  name: string;
  parent: string | null;
}
```

**Display**:
- Student side: home "Progress" card by chapter granularity (coarse)
- Parent side: web dashboard "Common Core Progress" by standard code (fine)

### 4.7 Classroom C3 Layout (English / Charlotte Mason feel)

```
┌────────────────────────────────────────────────────────┐
│ Header: ☰ OpenMAIC 🍁 Ms. Maple [📖][📔][🎨] 🍅12:14 💬² │
├──────────────────────────┬─────────────────────────────┤
│ Classroom (full left)     │ Today's Lesson              │
│                          │                             │
│ 🌿 Today's nature walk:  │ ┌─ Q3 of 5 ⭐⭐ ~3min ──┐  │
│ Notice how leaves change │ │                        │  │
│ in autumn — count the    │ │   1/2 + 1/3 = ?        │  │
│ different colors.        │ │   answer [___] [Submit]│  │
│                          │ │ [✋ help] [💡 hint]     │  │
│ ┌─ SLATE ──────────────┐ │ │ 📐 CC 4.NF.A.1         │  │
│ │ Adding fractions     │ │ └────────────────────────┘  │
│ │ ① Find common denom▶│ │                             │
│ │ ② Convert: 1/2→3/6 │ │ 📔 This Week's Portfolio    │
│ │ ③ Add: 3/6 + 2/6   │ │ ┌─ Week 12 · Adding Frac ┐ │
│ └─────────────────────┘ │ │ 8 problems · 2 mistakes   │ │
│                          │ │ 📐 CC 4.NF.A.1 · 5/5 days│ │
│ 🍁 Ms. Maple · mentor   │ └────────────────────────┘ │
│ 💬 "Emma raised hand —   │ ┌─ Week 11 · Place Value ┐ │
│ why common denominator?" │ │ 12/13 solved · ⭐⭐⭐    │ │
│                          │ └────────────────────────┘ │
│ ┌─ 3 buddies (regional)┐│                             │
│ │ Emma 📍 Brooklyn ✋  ││                             │
│ │ "Like Lego pieces..."││                             │
│ │ Noah 📍 San Diego 💭 ││                             │
│ │ "I'm confused 😅"    ││                             │
│ │ 📷 You 📍 Home 🦊    ││                             │
│ └─────────────────────┘│                             │
│ ╭─ whisper (Noah↔Emma) ─╮│                             │
├──────────────────────────┴─────────────────────────────┤
│ Input bar: 📷 [Ask Ms. Maple or buddies...] 🎤 ✋      │
└────────────────────────────────────────────────────────┘
```

**International key design points** (vs China):
- Warm wood palette (vs purple)
- "Mentor" framing (not teacher) — parent is primary teacher
- Buddies have cities (Emma Brooklyn / Noah San Diego)
- Common Core standard code (4.NF.A.1) — parent sees what child works on
- Charlotte Mason 20-min pomodoro (vs 25-min)
- Nature walk banner — Charlotte Mason philosophy
- Wooden slate (vs blackboard) — Charlotte Mason tradition

### 4.8 Mode Switching (Lesson / Portfolio / Free Time)

- **Lesson** (default): right pane shows current problem + portfolio
- **Portfolio**: right pane shows weekly recap + standards progress
- **Free Time**: right pane blank or chat drawer open, pure companion chat

### 4.9 Parent Web Dashboard + Push

**Web dashboard features**:
- Weekly portfolio (auto-generated recap)
- Common Core standards progress (with weekly delta)
- Mistake book view (parent sees child's mistakes + how-to-teach suggestions)
- MAP / Iowa Test prep suggestion (home school standardized test prep)
- Push channel picker (Email / WhatsApp / SMS)
- Mentor chat summary + on-demand full access
- Stripe subscription management
- Parent notes attached to portfolio entries

**Push channels** (multi, parent picks):
- **Email digest** (default): weekly Sunday 7pm local time
- **WhatsApp Business API**: daily 8pm local time opt-in
- **SMS**: urgent only (struggle streak / safety alerts)

**WhatsApp template**:
```
📊 Lily · Today's report
⏱️ 32m  ✅ 7/9  ❌ 2  💬 4 questions
⚠️ Adding fractions (CC 4.NF.A.1) still a weak spot (32% mastery)
💬 "Why do we need a common denominator?" — breakthrough today!
💡 Ask her tonight: "What was the trick?" — she figured it out!

View full report → openmaic.app/parent/lily/week-12
```

**Frequency strategy**:
- Default Email: weekly (Sunday 7pm local)
- WhatsApp opt-in: daily or weekly (parent picks)
- Emergency: immediate push (mood alert / repeat-mistake / inactivity)

### 4.10 Admin Console

**Navigation groups**:
- Overview (Dashboard / Action queue)
- Students (Manage / Progress / Parent feedback)
- Content (Generate course / Textbooks / **Persona templates** / Mistake library)
- Operations (Push / Settings / Stripe)

**Persona Template Library** (new section):
- View platform presets (mentor + buddy)
- Create new template (persona + voice + avatar + sample dialogue)
- Edit templates (operator has permission)
- Audit trail (who edited when)

**Generate Course** (reuse OpenMAIC existing outline + scene-content flow):
- Fields: content type / textbook / grade / requirement / linked personas / audience
- One-click generate → push to selected student cohort

---

## 5. Error Handling

| Scenario | Handling |
|---|---|
| LLM response timeout | Retry 1× + "Mentor is thinking..." placeholder + fallback text |
| LLM invalid action type | Storage sanitizer (commit 423b86b1) |
| Email send failure (SendGrid) | Retry 3× (exp backoff); log failure; queue for next cron |
| WhatsApp template rejection | Admin alert; template needs Meta re-approval |
| WhatsApp rate limit (24h/1 template) | Queue messages, spread across day |
| SMS failure (Twilio) | Retry 2×; fallback to email |
| Parent unsubscribes | push_subscriptions.enabled = false; data preserved |
| Photo OCR failure | Prompt retake with lighting/angle tips |
| Error reasoner uncertain | Tag "needs human review", default "other" |
| Cross-student mentor memory leak | **audit_logs alert + immediate session freeze** |
| Parent no full-chat grant | Mentor chat only returns summary + mood timeline |
| Operator RBAC violation | RBAC middleware denies + audit_log entry |
| Student tries to access other student's data | RBAC middleware denies |
| Stripe payment failure | Show clear retry; downgrade to free trial grace period |

---

## 6. Testing / Acceptance

### 6.1 Unit Tests

- Error reasoner (5 categories ≥ 85% accuracy)
- Spaced repetition algorithm
- Knowledge mastery update rules
- Persona clone chain (source_template_id correct)
- Storage sanitizer (commit 423b86b1)
- RBAC middleware (each op checks owner_type + owner_id)
- Push channel picker logic

### 6.2 Integration Tests

- Director graph: single-turn next_agent correct
- Multi-agent: mentor + 2 buddies rotate without leaking memory
- Email push: template render + SendGrid + failure retry
- WhatsApp push: template approval + opt-in flow + rate limit
- Stripe: subscription state machine
- Persona clone chain end-to-end

### 6.3 E2E (Playwright)

- Parent signs up → adds child → picks mentor + buddies → binds Email + WhatsApp → child has first lesson
- Child takes lesson → mistake in book → parent sees in digest → reviews together
- Operator creates new persona template → assigned to test student → appears in onboarding
- RBAC: operator tries other class → denied + audit log

### 6.4 Business Metrics

| Metric | Target |
|---|---|
| Student 14-day retention | ≥ 50% (home school parents more stable) |
| Daily time on platform | 15-30 min |
| Email open rate | ≥ 65% |
| WhatsApp read rate | ≥ 80% (LATAM/EU) |
| Portfolio auto-summary adoption | ≥ 70% |
| Buddy interaction frequency | ≥ 20 turns/week/student |
| Trial → paid conversion | ≥ 25% |
| NPS | ≥ 40 |
| Cross-student leak incidents | **0** (hard target) |

---

## 7. Work Phasing

### Phase 0: Already shipped (OpenMAIC existing)
- Multi-agent / chat runtime / agent registry / TTS / voice / document store
- Storage sanitizer (commit 423b86b1)

### Phase 1': Home School MVP (4 weeks, 2 people) ★

| Module | Days | Notes |
|---|---|---|
| Student profile + onboarding (grade/style/textbook/region) | 3 | full-stack |
| **Persona template library** + onboarding select | 4 | full-stack + AI |
| Persona clone chain (template → student instance) | 2 | backend |
| Mistake book + error reasoner (Common Core tags) | 1 week | full-stack |
| Mentor persona system + Socratic prompt + **memory isolation** | 4 | AI |
| Study buddy system (2 with regional cities) | 5 | full-stack + AI |
| Pomodoro (20-min Charlotte Mason) | 2 | full-stack |
| Spaced repetition review mode | 4 | full-stack |
| Knowledge graph (Common Core standards) | 3 | AI + backend |
| **Weekly Portfolio auto-summary** | 3 | AI |
| Email digest generation (push to admin console first) | 3 | AI + backend |
| Parent web dashboard (MVP version) | 5 | full-stack |
| Classroom layout C3 (mentor + buddies + standards) | 1 week | frontend |
| RBAC middleware + audit_logs | 3 | backend |
| Stripe billing integration | 3 | backend |
| **WhatsApp Business API** | 4 | backend |

### Phase 2': WhatsApp + Email + Push Polish (2-3 weeks)

- Email via SendGrid/Resend with template customization
- WhatsApp template pre-approval flow
- MAP / Iowa Test prep module (practice problems + readiness score)
- Parent weekly portfolio PDF export
- Buddy regional pool expansion (more cities + countries)

### Phase 3': Full Version (3-4 weeks)

- Charlotte Mason / Classical curriculum content libraries
- Reading practice with speech evaluation
- Mood detection (frustration / boredom / engaged, intensity)
- Mentor persona "growth" (parent feedback evolves personality)
- Parent assistant pedagogical depth
- Co-op matching (real cross-home-school buddy matching if family opts in)

### Phase 4': SEA + EU Expansion

- Singapore / Malaysia / Thailand (English + bilingual support)
- EU: GDPR compliance, Common Core → local standards (UK National Curriculum, etc.)
- iOS / Android native apps (PWA → native for offline-first)

---

## 8. Risks & Dependencies

| Risk | Impact | Mitigation |
|---|---|---|
| WhatsApp template pre-approval slow | Phase 1' delayed | Submit early; fallback to Email-only v1 |
| Stripe cross-border issues (some regions) | Signup friction | Support Paddle as fallback |
| LLM Socratic tutoring quality unstable | Core experience | Prompt iteration + few-shot + human eval |
| Error reasoner accuracy low | Parent reports inaccurate | Label "AI inferred", parent can correct |
| End-to-end latency | Student impatience | Streaming + placeholder + pomodoro buffer |
| Common Core mapping cost | Operational burden | Start with grade-level granularity, defer per-standard |
| **Cross-student data leak** | **Fatal (COPPA + GDPR-K + trust)** | RBAC + audit_logs + 0-tolerance test |
| Mentor memory LLM cross-student bleed | Severe | Prompt reinforcement + server-side owner_id check |
| US state-by-state home school regulation variance | Compliance | No automated assessment v1; parent-led |
| Religious content neutrality | Some home school families have religious context | Filter option for families to set content neutrality level |

### External Dependencies

- **WhatsApp Business Cloud API** (Meta) — apply early
- **SendGrid or Resend** for Email
- **Twilio** for SMS fallback
- **Stripe** for billing
- **MiniMax API key** (configured) + OpenAI fallback
- **TTS / Image / Video providers** (MiniMax configured)
- **PostgreSQL** for production

---

## 9. Relationship with China Variant

Architecture base (multi-agent / director / storage / knowledge graph / RBAC / audit) **fully shared**. Differences:

| Layer | China | International |
|---|---|---|
| Persona naming | 班主任 (class teacher) | Mentor |
| Buddy design | 2 buddies with city | 2-3 buddies with region (cross-cohort co-op) |
| Lesson rhythm | 25-min pomodoro | 20-min Charlotte Mason |
| Textbook | 人教版 / 苏教版 / 北师大 | Common Core / Singapore Math / UK |
| Parent panel | WeChat mini-program | Web dashboard + Email + WhatsApp |
| Push channel | WeChat long-term subscription | Email (default) + WhatsApp opt-in + SMS |
| Assessment | Mistake book | Portfolio + Common Core standards + MAP prep |
| Persona creation | 5-10 templates, parental tweak | Same |
| Buddy geo | Beijing / Shanghai / etc. (city) | US states / countries (regional co-op) |
| Color palette | Purple | Warm wood |
| Blackboard | Blackboard | Wooden slate |
| Admin | Same | Same |

**Shared code layer** (v1 design): `/lib/companion-core/`
- Director / error reasoner / knowledge graph / RBAC middleware

**Differentiated layers**:
- `/apps/cn/` — China UI + WeChat integration + 班主任 naming
- `/apps/intl/` — International UI + Email/WhatsApp + mentor naming

See `2026-08-25-companion-cn.md` for China variant.
