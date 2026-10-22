# System Throughput Mapping

Map the system as a sequence of steps and measure the throughput capacity of each step independently.

## Inputs

- `system-description`: The system to audit (a business process, a production line, a personal workflow, a sales funnel, a software pipeline)
- `throughput-goal`: The desired throughput of the system (units per time period)

## Outputs

- `step-sequence`: The system mapped as a sequence of steps, each with its throughput capacity (units it can process per time period)
- `current-throughput`: The actual throughput of the whole system, which equals the throughput of the slowest step

## Process

1. Map the system as a linear sequence of steps from input to output. Even complex systems can usually be linearized for bottleneck analysis by following the main flow.
2. For each step, measure its independent capacity: how many units could this step process per time period if it had unlimited input and no downstream backup?
3. Identify the current throughput of the entire system. By definition, it equals the capacity of the slowest step. If step 3 can only process 50 units/day and every other step can process 100+, the system produces 50.
4. Verify by checking: is there inventory (work, tasks, leads, items) building up before any step? The step with the longest queue in front of it is likely the bottleneck.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
