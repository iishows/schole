# OpenMAIC Companion · EU-DE (Deutschland, GDPR-K)

**Independent deployment** · **Region: eu-de**

## Produkt

KI-Begleiter für deutsche Schulkinder. Mentorin (Frau Eule) + 2 Lernfreunde (Lina Berlin / Finn München). DSGVO-konform.

## Independent Deployment

| Field | Value |
|---|---|
| Deploy target | Web dashboard + Email (only) |
| Compliance | GDPR-K (DSGVO) + KMK |
| Data residency | **EU** (mandatory) |
| Push | Email (only — no SMS/WhatsApp for EU minors) |
| Payment | Stripe + PayPal |
| Pricing | €18.99-32.99/mo |
| Default language | de-DE |
| Enabled languages | de-DE, en-DE |
| Default theme | 🌊 Ocean (high-contrast required) |
| Accessibility | WCAG 2.1 AA required (high-contrast theme) |

## Lehrbücher

- Deutsches Mathematikbuch Klasse 4 (KMK)

## Deploy Command

```bash
cd apps/eu-de
pnpm install
pnpm build:de
pnpm deploy:de  # deploys to de.example.com (EU region, GDPR-K compliant)
```

## Spec

Region-spezifische Spec: [`SPEC.md`](./SPEC.md).
Gemeinsame Architektur-Spec: [`../../specs/companion.md`](../../specs/companion.md).
