# Constraint Elevation Plan

Elevate the bottleneck: increase its capacity. This is the only improvement that increases system output. Every other improvement is local optimization that does not flow through to the end customer.

## Inputs

- `bottleneck-stage`: The constraint to elevate
- `constraint-throughput`: Current throughput of the constraint
- `subordination-actions`: How other stages are already aligned

## Outputs

- `elevation-options`: Ranked list of ways to increase bottleneck capacity, with cost and expected throughput gain for each
- `selected-elevation`: The chosen elevation action with implementation plan

## Process

1. List every option to increase the bottleneck's throughput: more staff, better tools, process simplification, reducing setup time, running longer hours, offloading non-critical tasks.
2. For each option, estimate the cost and the throughput gain. Rank by throughput gained per dollar spent.
3. Select the option with the best ratio. If multiple small options together are cheaper than one large option, combine them.
4. Plan the implementation with a timeline. The bottleneck is the highest-priority improvement in the system.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
