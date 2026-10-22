# Critical Function Vendor Map

Map each critical function to its vendor or supplier and calculate the concentration percentage.

## Inputs

- `operation-description`: What the operation does and its critical functions
- `vendor-list`: All current vendors and suppliers with their function and spend

## Outputs

- `vendor-concentration-table`: For each critical function: the vendors serving it, the percentage of spend or capacity with each, and whether a single vendor exceeds 70% of the function
- `high-concentration-functions`: Functions where a single vendor holds more than 70% of the spend or capacity

## Process

1. List every critical function that relies on an external vendor or supplier. Include technology, raw materials, professional services, logistics, and infrastructure.
2. For each function, list every vendor that serves it. Calculate the percentage of spend or capacity that goes to each vendor.
3. Flag any function where a single vendor exceeds 70% of the spend or capacity. This is the concentration risk threshold.
4. For flagged functions, note the contractual terms: notice period, termination penalties, and any exclusivity clauses.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
