# Route Optimizer

Optimize delivery routes for distance and time.

## Inputs

- `delivery-clusters`: Orders grouped into geographic clusters
- `time-window-assignments`: Delivery time windows assigned per order

## Outputs

- `optimized-routes`: Sequenced routes per driver minimizing distance and time
- `route-metrics`: Estimated distance, time, and fuel for each route

## Process

1. Sequence stops within each cluster to minimize travel distance
2. Insert time window constraints into the sequence
3. Calculate estimated drive time, idle time, and fuel per route
4. Produce the optimized route set

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
