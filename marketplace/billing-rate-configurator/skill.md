# Billing Rate Configurator

Configure billing rates for attorneys, paralegals, and staff by matter or client.

## Inputs

- `rate-schedule`: Standard rate schedule for the firm or department
- `client-billing-agreement`: Any client-specific rate agreements or caps

## Outputs

- `approved-rates`: The approved billing rates by timekeeper and matter
- `billing-rules`: Any special billing rules (caps, discounts, block billing restrictions)

## Process

1. Load the standard rate schedule by timekeeper level (partner, associate, paralegal, staff).
2. Apply any client-specific overrides from the billing agreement.
3. Document the billing rules: maximum hours per task, block billing restrictions, expense caps.
4. Produce the approved rate card for the matter.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
