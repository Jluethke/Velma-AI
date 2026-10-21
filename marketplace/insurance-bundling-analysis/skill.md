# Insurance Bundling Analysis

Analyze multi-policy bundling discounts and determine if bundling or splitting saves more.

## Inputs

- `quote_matrix`: Individual policy quotes
- `current_bundling`: Current bundle if any

## Outputs

- `bundle_options`: Available bundles with discounts
- `split_vs_bundle`: Cost comparison bundled vs best individual
- `recommendation`: Bundle or split recommendation

## Process

1. Get bundled quotes from top carriers
2. Compare bundled total to best individual rates
3. Factor in loyalty discounts
4. Consider convenience of single carrier
5. Recommend based on total savings

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
