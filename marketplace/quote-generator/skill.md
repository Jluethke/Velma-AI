# Quote Generator

Generate a quote from the product catalog and pricing rules.

## Inputs

- `deal-requirements`: What the customer needs (products, quantities, terms)
- `pricing-rules`: Pricing tiers, discounts, and approval thresholds

## Outputs

- `draft-quote`: Quote with line items, pricing, and terms
- `approval-needed`: Whether the quote requires internal approval

## Process

1. Map the requirements to catalog items.
2. Apply standard pricing and any negotiated discounts.
3. Calculate the total and check against approval thresholds.
4. Produce the draft quote document.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
