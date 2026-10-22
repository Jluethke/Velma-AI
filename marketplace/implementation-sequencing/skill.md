# Implementation Sequencing

Sequence the source fixes by capacity released per unit of effort and set a metric to watch. The first fix should be the one that deletes the most recurring work for the least build, so the operation gets lighter fast.

## Inputs

- `source-fixes`: The designed source fixes
- `prevented-demand`: Demand each fix removes
- `capacity-released`: Capacity each fix frees

## Outputs

- `fix-sequence`: Fixes ordered by release per unit of effort
- `monitoring-metric`: The failure-demand metric to track after each fix

## Process

1. Rank the fixes by capacity released divided by effort required.
2. Sequence the highest-return fixes first so load drops quickly.
3. Set the failure-demand ratio as the metric to re-measure after each fix lands.
4. Define the target ratio that signals the operation is running mostly on value demand.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
