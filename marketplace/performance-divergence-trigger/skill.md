# Performance Divergence Trigger

Trigger rebalancing when a category's performance diverges from expectations, even if the allocation has not drifted.

## Inputs

- `drift-thresholds`: The allocation drift triggers
- `target-allocation`: The target allocation with expected returns

## Outputs

- `performance-triggers`: For each category: the minimum acceptable performance level and the performance decline that triggers review
- `combined-trigger-set`: The complete set of triggers: allocation drift and performance divergence, with the response for each

## Process

1. For each category, define the expected performance: the return, the output, the conversion rate, or whatever metric measures its value.
2. Set the performance trigger: a decline of more than 20% from the trailing average, or two consecutive periods below the minimum acceptable level.
3. When a performance trigger fires, the response is: investigate the cause (is it temporary or structural?), and if structural, reallocate away from the underperforming category.
4. Combine the drift triggers and performance triggers into a single trigger set. Any trigger that fires initiates a review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
