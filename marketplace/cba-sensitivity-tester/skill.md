# Cba Sensitivity Tester

Perform sensitivity analysis on key assumptions to test the stability of the recommendation.

## Inputs

- `financial-metrics`: Base case financial metrics
- `cost-assumptions`: Cost assumptions to vary
- `benefit-assumptions`: Benefit assumptions to vary

## Outputs

- `sensitivity-results`: Impact of varying key assumptions on the outcome
- `break-even-points`: Values at which the recommendation changes

## Process

1. Identify the top 5 assumptions with the most impact on the result.
2. Vary each assumption independently and recalculate NPV/ROI.
3. Determine break-even values where the recommendation would change.
4. Summarize which assumptions the decision is most sensitive to.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
