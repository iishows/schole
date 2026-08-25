# OpenMAIC Companion · US (US-TX home school)

**Independent deployment** · **Region: us-tx**

## Product

US home school family AI companion. Mentor (Ms. Maple) + 2 Study Buddies (Emma Brooklyn / Noah San Diego). COPPA + FERPA + Texas Education Code §25.086 compliant.

## Independent Deployment

| Field | Value |
|---|---|
| Deploy target | Web dashboard + Email + WhatsApp |
| Compliance | COPPA + FERPA + TX home school law |
| Data residency | us (optional) |
| Push | Email (Resend) + WhatsApp Business + SMS (Twilio fallback) |
| Payment | Stripe + PayPal |
| Pricing | $19.99-34.99/mo |
| Default language | en-US |
| Enabled languages | en-US, es-US |
| Default theme | 🌳 Warm-wood |

## Textbooks

- Common Core Grade 4 Math (operator-uploaded)
- Common Core Grade 4 ELA

## Deploy Command

```bash
cd apps/us
pnpm install
pnpm build:us
pnpm deploy:us  # deploys to us.example.com (TEXAS region)
```

## Spec

Region-specific spec: [`SPEC.md`](./SPEC.md).
Shared architecture spec: [`../../specs/companion.md`](../../specs/companion.md).

## Deploy Config

[`config.json`](./config.json) contains personas / textbooks / channels / compliance / pricing / onboarding / i18n / theme. Operator-editable via admin console.
