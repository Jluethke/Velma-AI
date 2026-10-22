# Cohort Curve Reader

Read the cohort curves: flattening (healthy), declining to zero (problem), or improving (ideal).

## Inputs

- `cohort-table-structure`: The populated cohort table
- `analysis-question`: What to understand

## Outputs

- `curve-analysis`: For each cohort: shape (flattening, declining, improving) and stabilization point
- `cohort-comparison`: Are recent cohorts improving, degrading, or stable vs. older ones?

## Process

1. Plot each cohort's curve over time. Look at shape, not just final number.
2. Flattening curve: remaining users are retained. Stabilization point is the long-term rate.
3. Declining to zero: leaky bucket. Where is the steepest drop? That is the intervention point.
4. Compare cohorts: newer better or worse? The trend reveals whether changes are working.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
