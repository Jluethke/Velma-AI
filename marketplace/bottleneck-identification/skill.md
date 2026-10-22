# Bottleneck Identification

Identify the single bottleneck: the step with the lowest throughput capacity that limits the entire system.

## Inputs

- `step-sequence`: All steps with their throughput capacities
- `current-throughput`: The system's actual throughput

## Outputs

- `bottleneck-step`: The specific step that is the constraint, with its capacity and the evidence
- `bottleneck-cost`: The cost of the bottleneck: the difference between the bottleneck's capacity and the desired throughput, multiplied by the value of each unit

## Process

1. The bottleneck is the step with the lowest throughput capacity. In a factory, it is the slowest machine. In a sales funnel, it is the stage with the lowest conversion rate. In a personal workflow, it is the task you can never keep up with.
2. Confirm the bottleneck by checking three signs: (1) it is always busy, (2) the steps before it have queued work waiting, (3) the steps after it are sometimes idle.
3. Calculate the cost of the bottleneck: every unit the bottleneck cannot process is a unit the system cannot produce. Multiply the gap (desired throughput minus bottleneck capacity) by the value per unit.
4. Resist the temptation to identify multiple bottlenecks. There is only one. If you think there are two, the real bottleneck is the one that, if removed, would cause the other to become the new constraint.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
