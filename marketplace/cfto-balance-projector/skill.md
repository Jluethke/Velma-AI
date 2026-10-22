# Cfto Balance Projector

Project the running balance across the horizon.

## Inputs

- `flow-calendar`: The dated inflows and outflows
- `recurring-items`: The repeating items to carry forward

## Outputs

- `daily-balance-curve`: The running balance for every day of the horizon
- `starting-balance`: The opening balance the curve carries from

## Process

1. Carry the opening balance forward day by day.
2. Apply each inflow and outflow on its date.
3. Produce the running balance for every day.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
