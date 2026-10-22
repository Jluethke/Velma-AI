# Error Budget Calculator

Calculate the error budget for each SLO and define policies for when the budget is exhausted.

## Inputs

- `slo-targets`: The SLO targets
- `critical-journeys`: The critical user journeys for context

## Outputs

- `error-budgets`: Calculated error budget for each SLO
- `budget-policy`: Policy for actions when budget is low or exhausted

## Process

1. Calculate the error budget as (1 minus SLO target) times the measurement window
2. Express the budget in concrete terms (allowed downtime minutes, failed requests)
3. Define the policy tiers (normal, warning at 50% consumed, freeze at 0%)
4. Specify actions at each tier (feature freeze, reliability-only work)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
