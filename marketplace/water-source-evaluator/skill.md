# Water Source Evaluator

Evaluate water source capacity and delivery system limits.

## Inputs

- `water-requirements`: Total water demand by zone
- `system-specs`: Pump capacity, pipe sizes, and emitter rates

## Outputs

- `delivery-capacity`: Maximum delivery rate by zone
- `system-constraints`: Bottlenecks or capacity shortfalls

## Process

1. Calculate the total water demand across all zones.
2. Compare demand to pump and well capacity.
3. Identify delivery bottlenecks (pipe size, pressure, emitter rate).
4. Flag zones where demand exceeds delivery capacity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
