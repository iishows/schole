# OpenMAIC Companion · INTL (International / Home School)

**Product code**: intl-companion
**Target market**: US / CA / AU home school families + SEA expats
**Target users**: K-5 students (5-10 yo) + home school parents
**Pricing**: $19.99 / $34.99 / mo (annual 20% off)
**Compliance**: COPPA + FERPA + GDPR-K + state-by-state home school laws

## Positioning

AI Mentor + regional Study Buddies (cross-cohort co-op feel) companion
home school lessons. Parent gets digest via Email (default) + optional
WhatsApp. Solves the #1 home school pain: parent can't teach every
subject + socialization gap.

## Spec

Full design spec in [`SPEC.md`](./SPEC.md) (copy of `specs/2026-08-25-companion-intl.md`).

## Shared Architecture

Builds on OpenMAIC monorepo core:
- `packages/@openmaic/dsl` — DSL types
- `packages/@openmaic/storage` — IndexedDB + PostgreSQL persistence
- `packages/@openmaic/generation` — outline + scene generation
- `packages/@openmaic/renderer` — rendering (incl. video export)

## Differentiation (international-only)

| Dimension | Implementation |
|---|---|
| Persona naming | Mentor + 2 Study Buddies (Emma 📍Brooklyn / Noah 📍San Diego) |
| Lesson rhythm | 20-min Charlotte Mason pomodoro |
| Textbook | Common Core / Singapore Math / UK National Curriculum |
| Parent panel | Web dashboard + Email digest + WhatsApp opt-in + SMS fallback |
| Push | SendGrid/Resend (Email) + WhatsApp Business Cloud API |
| Billing | Stripe ($19.99 / $34.99 / annual 20% off) |
| Classroom UI | Warm wood (#b8763e) + wooden slate (Charlotte Mason) |
| Co-op feel | Buddies regional cities auto-assigned by parent region |
| Test prep | MAP / Iowa Test prep module |

## Mockups

- `mockups/home-school-classroom.html` — Student view
- `mockups/home-school-parent-dashboard.html` — Parent web dashboard
- `mockups/home-school-onboarding.html` — Onboarding flow
- `mockups/whatsapp-push.html` — WhatsApp Business push template

## Paths

- Spec: `apps/intl-companion/SPEC.md`
- Future code: `apps/intl-companion/src/` (TBD)
- Reuses OpenMAIC core packages

## Run

```bash
# Main repo
pnpm install
pnpm dev  # at http://localhost:3000

# INTL-specific features behind flag:
# NEXT_PUBLIC_COMPANION_INTL=true
```
