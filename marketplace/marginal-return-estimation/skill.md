# Marginal Return Estimation

For each category, estimate the return of the NEXT dollar spent, not the average return of all dollars spent.

## Inputs

- `spending-table`: Categories with current spending and return metrics
- `total-spend`: Total current spending

## Outputs

- `marginal-returns`: For each category: the estimated return of the next $100 (or next $1000) spent, based on diminishing returns analysis
- `diminishing-returns-notes`: For each category: at what spending level do returns start to diminish significantly

## Process

1. The marginal return is NOT the average return. If marketing has spent $10,000 and generated $50,000 in revenue (5x average return), the NEXT $1,000 might only generate $2,000 (2x marginal return) because the easy opportunities have been captured.
2. Estimate the marginal return by looking at the most recent spending increment. What was the return on the last $1,000 added to this category? This is a better estimate of the next $1,000 than the overall average.
3. For categories where you have never varied the spending, estimate by asking: if I doubled this spending, would the return double? If not, marginal returns are diminishing.
4. Note the diminishing returns curve for each category. Most categories follow an S-curve: low returns at first (learning/setup), high returns in the middle (sweet spot), diminishing returns at the top (saturation).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
