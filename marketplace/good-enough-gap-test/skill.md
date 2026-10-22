# Good Enough Gap Test

Test whether the theoretical maximum clears the goal. This single comparison decides everything downstream, because it separates problems that tuning can solve from problems built into the structure.

## Inputs

- `theoretical-max-output`: The structure's ceiling
- `per-step-ceiling`: Per-step maximums
- `system-goal`: The target output

## Outputs

- `sufficiency-verdict`: Whether the optimized ceiling clears the goal
- `gap-size`: How far the ceiling sits above or below the goal

## Process

1. Compare the theoretical maximum against the goal.
2. Record whether the ceiling clears the goal with room to spare, barely, or not at all.
3. Measure how far the ceiling sits above or below the goal.
4. Treat a ceiling below the goal as proof that no amount of optimization can succeed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
