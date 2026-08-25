# OpenMAIC Companion · SG Region Spec

**Deployment**: Independent (apps/sg)
**Region**: sg
**Shared architecture spec**: [`../../specs/companion.md`](../../specs/companion.md)

---

## 1. Overview

Singapore student AI companion. Bilingual (EN/ZH) mentor (Ms. Merlion) + 2 buddies (Jia + Wei). PDPA compliant.

## 2. Independent Deployment

| Field | Value |
|---|---|
| Deploy URL | sg.example.com |
| Deploy infrastructure | AWS ap-southeast-1 (Singapore) |
| Data residency | SG (preferred) |
| Database | RDS PostgreSQL (ap-southeast-1) |
| Object storage | S3 (ap-southeast-1) |

## 3. Business Config

| Config | Value |
|---|---|
| Persona | Ms. Merlion + Jia + Wei |
| Textbooks | Singapore Math Primary 4 |
| Push channels | Email + WhatsApp |
| Compliance | PDPA 2012 |
| Pricing | S$25.99 solo / S$45.99 family |
| Payment | Stripe |
| Onboarding | 6 steps |
| Languages | en-SG (default), zh-SG (bilingual) |
| Theme | 🌊 Ocean |

## 4. Work Phasing (SG-specific)

| Phase | Content | Weeks |
|---|---|---|
| SG-1 | Clone from AU + adjust for SG region | 1 week |
| SG-2 | Singapore Math upload + PDPA compliance | 2 weeks |
| SG-3 | Bilingual UX + speech evaluation (EN/ZH) | 2 weeks |

## 5. Risks

| Risk | Mitigation |
|---|---|
| PDPA do-not-call registry | Honor opt-out within 30 days |
| Cross-border data flow | Default SG region; document |

## 6. Config

- `./config.json` · `../../specs/companion.md` · `../../mockups/`
