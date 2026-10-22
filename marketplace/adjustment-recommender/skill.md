# Adjustment Recommender

Recommend compensation adjustments with cost projections.

## Inputs

- `market-position-summary`: Market position by role
- `risk-assessment`: Risk assessment

## Outputs

- `adjustment-recommendations`: Recommended pay adjustments by role
- `cost-projection`: Total cost of proposed adjustments

## Process

1. Propose target percentiles for each role based on talent strategy
2. Calculate the adjustment needed for each incumbent
3. Project the total cost of all adjustments
4. Phase the adjustments if budget is constrained

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
