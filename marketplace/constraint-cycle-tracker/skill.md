# Constraint Cycle Tracker

Track the constraint cycle over time. As bottlenecks are elevated, new ones emerge. The cycle never ends. The system improves by working the constraint cycle faster, not by reaching a state without constraints.

## Inputs

- `elevation-decision`: The investment made to elevate the bottleneck
- `system-flow-map`: The updated system flow

## Outputs

- `constraint-cycle-log`: The history of bottleneck identifications, exploitations, subordinations, and elevations, with the throughput gain at each step
- `current-bottleneck-report`: The current bottleneck, its utilization, and the next exploitation opportunity

## Process

1. Log the constraint cycle: when was each bottleneck identified, what was done to exploit and subordinate it, when was it elevated, and what throughput gain resulted?
2. After each elevation, immediately re-identify the new bottleneck. Do not assume: measure utilization at every step.
3. Compare the system's throughput over time. Each constraint cycle should produce a measurable throughput increase. If it does not, the exploitation or subordination was incomplete.
4. Set the review cadence: weekly bottleneck check (has it moved?), monthly exploitation review (are we getting everything from it?), quarterly elevation review (should we invest?).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
