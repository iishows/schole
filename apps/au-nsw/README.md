# OpenMAIC Companion · AU-NSW (Australian home school)

**Independent deployment** · **Region: au-nsw**

## Product

Australian home school family AI companion (NSW curriculum). Mentor (Ms. Wattle) + 2 Study Buddies (Olivia Melbourne / Jack Sydney). Privacy Act 1988 compliant.

## Independent Deployment

| Field | Value |
|---|---|
| Deploy target | Web dashboard + Email + WhatsApp |
| Compliance | Privacy Act 1988 (Cth) |
| Data residency | au (optional) |
| Push | Email + WhatsApp Business |
| Payment | Stripe |
| Pricing | A$29.99-54.99/mo |
| Default language | en-AU |
| Default theme | 🌳 Warm-wood |

## Textbooks

- Australian Curriculum Grade 4 Math (ACv9)

## Deploy Command

```bash
cd apps/au-nsw
pnpm install
pnpm build:au
pnpm deploy:au  # deploys to au.example.com (NSW region)
```

## Spec

Region-specific spec: [`SPEC.md`](./SPEC.md).
Shared architecture spec: [`../../specs/companion.md`](../../specs/companion.md).
