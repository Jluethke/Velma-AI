# Theoretical Max Modeling

Model the output the system would reach if every step ran at its theoretical maximum. This ceiling, not the current output, is what tells you whether optimization has room to solve the problem.

## Inputs

- `system-goal`: The target output
- `current-output`: The current output

## Outputs

- `theoretical-max-output`: The output if every step hit its maximum
- `per-step-ceiling`: The maximum each step could reach

## Process

1. For each step, estimate the maximum output it could reach if perfectly run.
2. Combine the per-step ceilings through the structure to get the system's theoretical maximum.
3. Respect the structure, since a series of steps is capped by its tightest link even at maximum.
4. Record the ceiling as the best the current structure could ever do.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
