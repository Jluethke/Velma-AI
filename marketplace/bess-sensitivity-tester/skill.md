# Bess Sensitivity Tester

Stress the return assumptions to find the break-even threshold.

## Inputs

- `payback-months`: The base payback period
- `return-assumptions`: The assumptions to stress

## Outputs

- `sensitivity-table`: Payback under lower returns and a longer ramp-up
- `breakeven-threshold`: The minimum monthly return that still pays back in time

## Process

1. Recompute the payback if the return is thirty percent lower.
2. Recompute the payback if the ramp-up doubles.
3. Find the minimum monthly return that still pays back inside the horizon.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
