# Retention Curve Builder

Build the retention curve by cohort. The shape of the curve tells you whether you have product-market fit and where you lose people.

## Inputs

- `cohort-classification`: User classifications per period
- `growth-narrative`: The story the growth data tells

## Outputs

- `retention-curves`: For each acquisition cohort: the percentage still active at 1, 2, 3, 6, and 12 periods after joining
- `flattening-point`: The period at which the retention curve flattens (the natural retention rate). If it never flattens, you do not have product-market fit for that cohort.

## Process

1. For each cohort (users who joined in a given period), track what percentage are still active at each subsequent period.
2. Plot the curves. A healthy curve drops initially (not everyone sticks) then flattens at a stable retention rate. The flattening point and the stable rate are your two key numbers.
3. If the curve never flattens (it keeps declining toward zero): you do not have product-market fit for that cohort. Investigate what is different about cohorts whose curves do flatten.
4. Compare cohorts over time. Are newer cohorts retaining better or worse than older cohorts? Improving retention curves mean the product is getting better for new users.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
