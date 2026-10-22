# Demand Scenario Modeler

Model demand scenarios to stress-test inventory plans.

## Inputs

- `reorder-points`: Calculated reorder points
- `demand-patterns`: Demand patterns

## Outputs

- `scenario-results`: Results from base, high-demand, and low-demand scenarios
- `risk-assessment`: Stockout and overstock risk by SKU

## Process

1. Define scenarios: base case, high demand (+20%), low demand (-20%).
2. Run each scenario through the inventory model.
3. Calculate stockout probability and excess inventory cost per scenario.
4. Identify high-risk SKUs that need closer monitoring.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
