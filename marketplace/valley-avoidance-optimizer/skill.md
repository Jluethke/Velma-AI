# Valley Avoidance Optimizer

Shift movable outflows away from valley days to flatten the balance curve and eliminate dangerous dips.

## Inputs

- `valley-days`: Days where balance hits minimum
- `movable-outflows`: Outflows that can be shifted, with current day and amount
- `daily-balance-curve`: Current running balance by day

## Outputs

- `shift-recommendations`: For each movable outflow near a valley, the recommended new day and the balance improvement
- `optimized-balance-curve`: The new daily balance curve after applying the recommended shifts

## Process

1. For each valley day, identify which movable outflows fall within 2 days of the valley (on the valley day or the 2 days before it, since those outflows contribute to the dip).
2. For each identified outflow, calculate the best target day: the day within its flexibility range that has the highest balance surplus. Prefer moving outflows to the day after the largest inflow.
3. Simulate the new balance curve with the shifted outflows. Recalculate valley depths. If any valley remains below the safety threshold, iterate by shifting the next-largest movable outflow.
4. Calculate the net improvement: how much the shallowest valley day improved, and whether all valleys now stay above the safety threshold.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
