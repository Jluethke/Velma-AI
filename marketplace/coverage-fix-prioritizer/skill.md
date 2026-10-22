# Coverage Fix Prioritizer

Prioritize the coverage fixes: close gaps by risk severity, eliminate overlaps by premium savings.

## Inputs

- `coverage-gaps`: The identified gaps
- `coverage-overlaps`: The identified overlaps

## Outputs

- `coverage-action-plan`: Ordered list of coverage changes: new policies to buy, limits to increase, policies to drop, with estimated premium impact for each
- `annual-premium-projection`: The projected total annual premium after all changes, compared to the current total

## Process

1. For each gap, get quotes for coverage. Compare the annual premium to the annual expected loss (probability times maximum loss). If the premium is less than the expected loss, the coverage is worth buying.
2. For each overlap, determine which policy to keep (better terms, lower premium, broader coverage) and which to drop or reduce.
3. Order the actions: close the highest-exposure gaps first, then eliminate the most expensive overlaps.
4. Calculate the net premium change. Present as a before-and-after comparison.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
