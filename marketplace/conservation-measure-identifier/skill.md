# Conservation Measure Identifier

Identify energy conservation measures and calculate savings and payback.

## Inputs

- `equipment-inventory`: Inventory of energy-consuming equipment
- `waste-observations`: Observed energy waste

## Outputs

- `ecm-list`: List of energy conservation measures with estimated savings, cost, and simple payback
- `prioritized-measures`: Measures ranked by payback period and implementation ease

## Process

1. For each waste observation, define the corrective measure (retrofit, controls upgrade, behavioral change).
2. Estimate the annual energy savings for each measure using engineering calculations or benchmarks.
3. Estimate the implementation cost for each measure.
4. Calculate the simple payback period and rank measures by attractiveness.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
