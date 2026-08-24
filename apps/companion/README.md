# OpenMAIC Companion (region-driven)

**Product code**: companion
**Architecture**: Single product, region-scoped configuration
**Target markets**: CN / US-TX / AU-NSW / SG / EU-DE / ... (extensible)

## Positioning

AI mentor + study buddies companion learning. Universal across regions
— region-specific flavors (Chinese 双职工 family / US home school /
SG expat) are **configuration**, not code.

## Spec

Full design in [`SPEC.md`](./SPEC.md) (canonical source: `specs/companion.md`).

## Region Configuration

Each region lives at `regions/<region>/config.json`. 5 example regions:

| Region | Display | Locale | Channels | Color |
|---|---|---|---|---|
| `cn/` | 中国大陆 | zh-CN | WeChat mini-app + WeChat official | Purple |
| `us-tx/` | United States (Texas) | en-US | Email + WhatsApp + SMS | Warm wood |
| `au-nsw/` | Australia (NSW) | en-AU | Email + WhatsApp | Warm wood |
| `sg/` | Singapore | en-SG | Email + WhatsApp | Warm wood |
| `eu-de/` | Germany (GDPR-K) | de-DE | Email | Teal |

See [`regions/cn/config.json`](./regions/cn/config.json) for the full
example with: 5 mentor templates + 3 buddy templates + 2 textbook
adapters + 2 push channels + PIPL compliance + 2 pricing plans.

## Adding a New Region

Operators add regions by:
1. Creating `regions/<region>/config.json` per the schema in SPEC §2.1
2. Uploading textbooks (operator UI in admin console)
3. Creating persona templates (operator UI)
4. Enabling push channels + setting compliance
5. Setting pricing + payment methods
6. Translating i18n bundle

See SPEC §8 for the full operational checklist.

## Paths

- Canonical spec: `specs/companion.md`
- Region configs: `apps/companion/regions/<region>/config.json`
- Future code: `apps/companion/src/`
- Reuses OpenMAIC core packages (`packages/@openmaic/*`)

## Run

```bash
# Main repo
pnpm install
pnpm dev  # at http://localhost:3000

# Single flag — region picked at runtime
# NEXT_PUBLIC_COMPANION=true
```
