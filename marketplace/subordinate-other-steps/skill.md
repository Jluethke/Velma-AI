# Subordinate Other Steps

Subordinate all other steps to the bottleneck: pace the entire system to the bottleneck's rhythm.

## Inputs

- `exploitation-actions`: How the bottleneck is being maximized
- `step-sequence`: All steps in the system

## Outputs

- `subordination-plan`: How each non-bottleneck step will be paced to the bottleneck's throughput (producing only as much as the bottleneck can consume)
- `waste-reduction`: Inventory and work-in-progress that will be reduced by subordinating

## Process

1. Set the pace of every step before the bottleneck to match the bottleneck's consumption rate. If the bottleneck processes 50 units/day, step 1 should produce 50 units/day, not 100. Overproduction before the bottleneck creates inventory that costs money and space.
2. Set the pace of every step after the bottleneck to process whatever the bottleneck outputs without delay. The bottleneck's output should never wait.
3. This feels counterintuitive: you are deliberately slowing down non-bottleneck steps. But a non-bottleneck step running at full speed creates waste (inventory) without increasing system throughput.
4. Measure work-in-progress inventory before and after subordination. A well-subordinated system has small, consistent buffers, not large, growing piles.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
