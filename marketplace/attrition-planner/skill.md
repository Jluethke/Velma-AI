# Attrition Planner

Plan for attrition: estimate the dropout rate, inflate the sample size accordingly, and design retention strategies.

## Inputs

- `minimum-sample-size`: The sample size before attrition adjustment
- `study-duration`: How long subjects will be followed or involved

## Outputs

- `adjusted-sample-size`: The enrollment target after inflating for expected attrition
- `retention-plan`: Strategies to minimize dropout and methods to handle missing data

## Process

1. Estimate the attrition rate from prior studies or pilot data.
2. Inflate the sample size using the formula: N_adjusted = N_min / (1 - attrition_rate).
3. Design retention strategies appropriate to the population and study length.
4. Plan the missing data strategy (intention-to-treat, multiple imputation, sensitivity analysis).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
