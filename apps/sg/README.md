# OpenMAIC Companion · SG (Singapore)

**Independent deployment** · **Region: sg**

## Product

Singapore student AI companion. Bilingual (EN/ZH) mentor (Ms. Merlion) + 2 buddies (Jia + Wei). PDPA compliant.

## Independent Deployment

| Field | Value |
|---|---|
| Deploy target | Web dashboard + Email + WhatsApp |
| Compliance | Personal Data Protection Act 2012 |
| Data residency | sg (optional) |
| Push | Email + WhatsApp Business |
| Payment | Stripe |
| Pricing | S$25.99-45.99/mo |
| Default language | en-SG |
| Enabled languages | en-SG, zh-SG (bilingual) |
| Default theme | 🌊 Ocean |

## Textbooks

- Singapore Math Primary 4

## Deploy Command

```bash
cd apps/sg
pnpm install
pnpm build:sg
pnpm deploy:sg  # deploys to sg.example.com
```

## Spec

Region-specific spec: [`SPEC.md`](./SPEC.md).
Shared architecture spec: [`../../specs/companion.md`](../../specs/companion.md).
