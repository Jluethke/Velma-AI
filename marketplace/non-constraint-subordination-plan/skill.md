# Non Constraint Subordination Plan

Subordinate every other stage to serve the bottleneck. Non-bottleneck stages should not produce faster than the bottleneck can consume, because the excess just piles up as inventory or work-in-progress.

## Inputs

- `stage-map`: The full process map
- `bottleneck-stage`: The identified constraint
- `constraint-throughput`: The bottleneck's measured throughput

## Outputs

- `subordination-actions`: Specific changes to upstream and downstream stages so they match the bottleneck's pace
- `wip-limits`: Work-in-progress limits for each stage, derived from the constraint's throughput

## Process

1. For each upstream stage, set a WIP limit so it cannot overproduce. Overproduction creates inventory that ties up resources and hides problems.
2. For each downstream stage, verify it has enough capacity to process what the bottleneck outputs without delay.
3. If the bottleneck ever starves (nothing to work on), fix the upstream feed first, because every minute the bottleneck is idle is a minute of system output lost forever.
4. Identify any policies or practices that waste bottleneck time (unnecessary setup, rework, multitasking) and mark them for removal.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
