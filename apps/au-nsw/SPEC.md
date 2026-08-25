# OpenMAIC Companion · AU-NSW Region Spec

**Deployment**: Independent (apps/au-nsw)
**Region**: au-nsw
**Shared architecture spec**: [`../../specs/companion.md`](../../specs/companion.md)

---

## 1. Overview

Australian home school (NSW) AI companion. Mentor (Ms. Wattle) + 2 buddies (Olivia Melbourne / Jack Sydney). Privacy Act 1988 compliant.

## 2. Independent Deployment

| Field | Value |
|---|---|
| Deploy URL | au.example.com |
| Deploy infrastructure | AWS ap-southeast-2 (Sydney) |
| Data residency | AU (preferred) |
| Database | RDS PostgreSQL (ap-southeast-2) |
| Object storage | S3 (ap-southeast-2) |

## 3. Business Config

| Config | Value |
|---|---|
| Persona | Ms. Wattle + Olivia + Jack |
| Textbooks | Australian Curriculum Grade 4 Math (ACv9) |
| Push channels | Email + WhatsApp |
| Compliance | Privacy Act 1988 (Cth) |
| Pricing | A$29.99 solo / A$54.99 family |
| Payment | Stripe |
| Onboarding | 6 steps |
| Language | en-AU only |
| Theme | 🌳 Warm-wood |

## 4. Work Phasing (AU-specific)

| Phase | Content | Weeks |
|---|---|---|
| AU-1 | Clone from US deployment + adjust for AU region | 1 week |
| AU-2 | AC textbook upload + Privacy Act compliance | 2 weeks |
| AU-3 | State-by-state expansion (NSW / VIC / QLD / WA) | 2 weeks |

## 5. Risks

| Risk | Mitigation |
|---|---|
| AU data residency expectations | Default AU region; document EU/US data flow paths |
| NSW vs VIC/QD state education laws | Track per-state; consult local experts |

## 6. Config

- `./config.json` · `../../specs/companion.md` · `../../mockups/`
