# Rate Shock Simulator

Simulate a rate shock: all variable rates increase by 200 basis points (2 percentage points). Calculate the monthly payment increases and the cascade effect.

## Inputs

- `baseline-model`: The baseline financial model with variable-rate obligations

## Outputs

- `rate-shock-result`: New monthly payment for each variable-rate obligation, total monthly increase, and the new surplus or deficit after the rate shock
- `rate-shock-exposure`: What percentage of total expenses are variable-rate sensitive, and the maximum rate increase the current surplus can absorb before going into deficit

## Process

1. For each variable-rate obligation, add 200 basis points (0.02) to the current rate. Recalculate the monthly payment using the standard amortization formula.
2. Sum the increase in monthly payments across all variable-rate obligations. This is the total rate shock impact. Subtract it from the current monthly surplus.
3. Calculate the maximum absorbable rate increase: the current monthly surplus divided by the rate sensitivity (the increase in monthly payments per 100 basis points of rate increase). This tells you how many basis points of increase you can survive before going negative.
4. If the entity has no variable-rate debt, the rate shock impact is zero for payments, but check savings and investment yields: higher rates might increase income from cash holdings, partially offsetting other pressures.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
