# Critical Function Inventory

Inventory every function that must continue for the operation to survive. A function is critical if pausing it for more than the tolerable downtime causes irreversible damage.

## Inputs

- `operation-description`: What the operation does (a business, a household, a project, a department)
- `tolerable-downtime`: The maximum time each function can be paused before the damage is irreversible

## Outputs

- `critical-function-list`: Every function classified as critical, with its tolerable downtime and the consequence of exceeding it
- `non-critical-functions`: Functions that can be paused for weeks without irreversible damage, noted for completeness

## Process

1. List every function the operation performs. For a business: revenue generation, customer delivery, payroll, compliance, IT infrastructure, communication. For a household: income, childcare, housing, health management, transportation.
2. For each function, ask: if this stops for [1 day / 1 week / 1 month], what is the consequence? Mark the point where the consequence becomes irreversible (customers leave permanently, legal penalties trigger, health deteriorates past recovery).
3. Functions where the irreversible point is less than 1 week are critical. Everything else is important but not critical.
4. Rank critical functions by the severity of the irreversible consequence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
