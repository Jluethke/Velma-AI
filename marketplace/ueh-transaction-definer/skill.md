# Ueh Transaction Definer

Define the unit of sale and its variable costs.

## Inputs

- `business-context`: The business and the period under review
- `unit-definition`: What counts as one unit, such as a customer, order, or seat

## Outputs

- `unit-model`: The defined unit and how it is counted
- `variable-cost-list`: The costs that scale with each unit

## Process

1. Define one unit of sale, such as a customer, an order, or a seat.
2. List the variable costs tied to each unit.
3. Separate variable costs from fixed costs that do not scale per unit.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
