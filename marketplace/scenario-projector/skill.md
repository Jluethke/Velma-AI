# Scenario Projector

Project the metric forward under three scenarios: current trajectory, a small improvement (1% better per period), and a small decline (1% worse per period).

## Inputs

- `baseline-value`: Current metric value
- `current-growth-rate`: Current per-period growth rate
- `compounding-frequency`: How often it compounds

## Outputs

- `projection-table`: Three columns (current, +1%, -1%) showing the metric value at 1 year, 5 years, and 10 years
- `divergence-points`: When the +1% and -1% scenarios diverge from each other by 2x, 5x, and 10x

## Process

1. For the current trajectory: apply the formula value = baseline times (1 + current rate) raised to N periods. Calculate for 1 year, 5 years, and 10 years of compounding periods.
2. For the +1% scenario: add 0.01 to the per-period growth rate. Recalculate at 1, 5, and 10 years. For the -1% scenario: subtract 0.01 from the per-period growth rate. Recalculate.
3. Calculate the divergence: at what point does the +1% scenario produce 2x the value of the -1% scenario? At what point 5x? 10x? The divergence timeline shows how quickly small differences become massive ones.
4. Express the results in concrete terms. Don't just say '37x'. Say: 'At your current savings rate of $500/month, you'll have $78,000 in 10 years. At $505/month (1% more), you'll have $83,500. At $495/month (1% less), you'll have $72,700. The gap between +1% and -1% is $10,800 over 10 years from a $10/month difference.'

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
