# Flow Conversion Feasibility

If the optimal batch size is 1 (or very small), evaluate converting to continuous flow. Flow eliminates all holding cost but requires that setup cost be effectively zero. Determine what it would take to reduce setup cost to near zero.

## Inputs

- `optimal-batch-size`: Calculated optimal size
- `setup-cost`: Current setup cost

## Outputs

- `flow-feasibility`: Whether the process can practically run as flow, with the specific changes needed
- `setup-reduction-plan`: If flow requires reducing setup cost, the plan to do so

## Process

1. If optimal batch size is 3 or fewer, investigate flow. The setup cost is the barrier.
2. List every component of the setup cost. Which components can be eliminated, automated, or performed in parallel with the previous item?
3. Apply SMED (Single Minute Exchange of Die) thinking: separate internal setup (must be done while stopped) from external setup (can be done while the previous item is running). Move as much as possible to external.
4. If setup can be reduced to under 5% of processing time, flow is feasible and almost always better (faster delivery, lower WIP, higher quality).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
