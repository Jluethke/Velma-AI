# Optimal Batch Size Calculator

Calculate the optimal batch size using the Economic Order Quantity formula adapted for processes: batch size = square root of (2 * demand rate * setup cost / holding cost per item). This minimizes total cost.

## Inputs

- `setup-cost`: Fixed cost per batch start
- `holding-cost-per-item`: Cost per item per time unit of waiting
- `current-batch-size`: Current batch size for comparison

## Outputs

- `optimal-batch-size`: The batch size that minimizes total cost (setup plus holding)
- `cost-comparison`: Total cost at current batch size vs. optimal batch size, showing the savings

## Process

1. Measure or estimate the demand rate (items arriving per time unit).
2. Apply the formula: optimal batch = sqrt(2 * demand * setup_cost / holding_cost). Round to the nearest practical number.
3. Calculate total cost at the current batch size: (demand / batch_size * setup_cost) + (batch_size / 2 * holding_cost).
4. Calculate total cost at the optimal batch size using the same formula. The difference is the savings from switching.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
