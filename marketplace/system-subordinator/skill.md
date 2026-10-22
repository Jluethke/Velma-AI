# System Subordinator

Subordinate everything else to the bottleneck's pace. Non-bottleneck resources should produce only what the bottleneck can process. Overproduction before the bottleneck creates inventory; underproduction starves it.

## Inputs

- `exploitation-plan`: The bottleneck exploitation actions
- `system-flow-map`: The system flow

## Outputs

- `subordination-rules`: For each non-bottleneck step: the production rate to match the bottleneck's pace, and the buffer size to maintain
- `resource-liberation`: Resources freed by slowing non-bottleneck steps to the bottleneck's pace, available for reallocation

## Process

1. Set each non-bottleneck step's production rate to match the bottleneck's throughput. Producing faster than the bottleneck can process creates waste (inventory, overwork, context switching).
2. Place a buffer before the bottleneck (to prevent starvation) and after it (to protect downstream from bottleneck variability). Size the buffers to cover the bottleneck's cycle time variability.
3. Identify the resources freed by subordination: if a non-bottleneck step was running at 90% but only needs to run at 60%, the difference is available for other uses.
4. Resist the temptation to keep non-bottleneck resources busy with non-essential work. Idle time at a non-bottleneck is free. Idle time at the bottleneck is the system's most expensive waste.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
