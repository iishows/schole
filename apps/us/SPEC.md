# OpenMAIC Companion · US Region Spec

**Deployment**: Independent (apps/us)
**Region**: us-tx
**Shared architecture spec**: [`../../specs/companion.md`](../../specs/companion.md)

---

## 1. Overview

US home school family AI companion. Mentor (Ms. Maple) + 2 Study Buddies (Emma Brooklyn / Noah San Diego / Mia Portland / Theo Seattle). COPPA + FERPA + Texas Education Code §25.086 compliant.

## 2. Independent Deployment

| Field | Value |
|---|---|
| Deploy URL | us.example.com |
| Deploy infrastructure | AWS us-east-1 + us-west-2 |
| Data residency | US (default) |
| Database | RDS PostgreSQL (us-east-1) |
| Object storage | S3 (us-east-1) |
| CDN | CloudFront |

## 3. Roles (per shared spec §3)

4 real + 5 virtual roles, shared architecture.

## 4. Business Config

| Config | Value |
|---|---|
| Persona templates | 5 mentors + 4 buddies + 1 parent_assistant |
| Textbooks | Common Core Grade 4 Math + ELA (operator-uploaded) |
| Push channels | Email (Resend) + WhatsApp Business + SMS (Twilio) |
| Compliance | COPPA + FERPA + TX §25.086 |
| Pricing | $19.99 solo / $34.99 family ≤3 kids |
| Payment | Stripe + PayPal |
| Onboarding | 7 steps (with recording consent per COPPA) |
| Default language | en-US |
| Enabled languages | en-US, es-US (latino families) |
| Default theme | 🌳 Warm-wood (Charlotte Mason aesthetic) |
| Available themes | Warm-wood, Light, Dark |
| Region-exclusive feature | `mapTestPrep: true` |

## 5. Data Flow

See shared architecture spec §3.3. Add region-specific steps:

```
Student finishes lesson
  ↓
Weekly Portfolio auto-generated
  ↓
Email digest sent Sunday 7pm CT (default)
  ↓
WhatsApp opt-in: daily 8pm CT (parents can enable)
```

## 6. Work Phasing (US-specific)

| Phase | Content | Weeks |
|---|---|---|
| US-1 | persona + onboarding + Email + Web dashboard | 4 weeks |
| US-2 | WhatsApp integration + Stripe billing | 2 weeks |
| US-3 | MAP test prep + speech evaluation | 2 weeks |

## 7. Risks

| Risk | Mitigation |
|---|---|
| COPPA compliance for recording | Default `classroomRecording: false` for US; only enable after COPPA consent flow |
| Texas state home school law variance | Track state-by-state; flag when adding new states |
| Stripe cross-border issues | Add Paddle as fallback |
| FERPA school records | Never auto-enroll without explicit school record opt-in |

## 8. Config Locations

- Deploy config: `./config.json`
- Shared architecture: `../../specs/companion.md`
- Mockups: `../../mockups/`
