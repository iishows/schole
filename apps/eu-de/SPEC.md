# OpenMAIC Companion · EU-DE Region Spec

**Deployment**: Independent (apps/eu-de)
**Region**: eu-de
**Shared architecture spec**: [`../../specs/companion.md`](../../specs/companion.md)

---

## 1. Übersicht

KI-Begleiter für deutsche Schulkinder. Mentorin (Frau Eule) + 2 Lernfreunde (Lina Berlin / Finn München). DSGVO-konform (GDPR-K).

## 2. Independent Deployment

| Field | Value |
|---|---|
| Deploy URL | de.example.com |
| Deploy infrastructure | AWS eu-central-1 (Frankfurt) — **EU region mandatory** |
| Data residency | **EU mandatory** (GDPR-K) |
| Database | RDS PostgreSQL (eu-central-1) |
| Object storage | S3 (eu-central-1) |
| CDN | CloudFront (EU edge locations) |

## 3. Business Config

| Config | Value |
|---|---|
| Persona | Frau Eule + Lina + Finn |
| Lehrbücher | KMK Mathematik Klasse 4 |
| Push channels | Email (only — no SMS/WhatsApp for minors per EU) |
| Compliance | GDPR-K (DSGVO) |
| Pricing | €18.99 solo / €32.99 family |
| Payment | Stripe + PayPal |
| Onboarding | 7 steps (with GDPR consent) |
| Languages | de-DE (default), en-DE |
| Theme | 🌊 Ocean (high-contrast required for WCAG 2.1 AA) |

## 4. Work Phasing (EU-DE-specific)

| Phase | Content | Weeks |
|---|---|---|
| DE-1 | Persona + GDPR consent flow + Email + Web | 4 weeks |
| DE-2 | High-contrast theme + WCAG audit | 1 week |
| DE-3 | KMK textbook upload + EU expansion (FR/NL) | 3 weeks |

## 5. Risiken

| Risk | Mitigation |
|---|---|
| DSGVO-Verstoß | Mandatory EU data residency; DPIA template per Article 35 |
| EU AI Act | Track; high-risk classification possible — legal review |
| Voice cloning regulation | Defer; current text-only |
| State-by-state (DE-Länder) education | Track 16 state curricula; KMK as baseline |

## 6. Config

- `./config.json` · `../../specs/companion.md` · `../../mockups/`
