# Icd Switching Cost Estimator

Estimate the switching costs of lock-in.

## Inputs

- `option-set`: The options under comparison
- `running-cost-with-complexity`: The running total to add switching cost onto

## Outputs

- `true-cost-table`: The full true cost per option after every layer
- `switching-cost-detail`: The exit cost and the lock-in flags per option

## Process

1. Estimate the cost to leave each option later.
2. Flag contracts, data, and habits that create lock-in.
3. Add the switching cost to the running total to form the true cost.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
