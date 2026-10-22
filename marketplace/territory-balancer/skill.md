# Territory Balancer

Balance territories by opportunity and workload.

## Inputs

- `market-potential-map`: Revenue potential by territory unit
- `current-account-assignments`: Existing rep-to-account mapping

## Outputs

- `balanced-territories`: Territory assignments balanced for fairness
- `balance-metrics`: Variance in potential and account count across territories

## Process

1. Calculate the target potential per territory.
2. Assign units to territories to minimize variance.
3. Check account count and travel distance constraints.
4. Iterate until balance metrics are within tolerance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
