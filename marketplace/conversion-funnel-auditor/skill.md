# Conversion Funnel Auditor

Audit the current conversion funnel to identify drop-off points.

## Inputs

- `storefront-url`: URL of the storefront to audit
- `analytics-access`: Access to analytics platform

## Outputs

- `funnel-analysis`: Conversion rates and drop-off points by stage
- `top-issues`: Prioritized list of conversion blockers

## Process

1. Map the funnel stages (landing, browse, product view, add to cart, checkout, purchase).
2. Calculate conversion rates between each stage.
3. Identify the stages with the largest drop-off.
4. Rank issues by estimated revenue impact.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
