# Driver Vehicle Assigner

Assign drivers and vehicles to optimized routes.

## Inputs

- `optimized-routes`: Sequenced routes per driver
- `route-metrics`: Estimated distance, time, and fuel for each route

## Outputs

- `driver-assignments`: Driver and vehicle assigned to each route
- `load-plans`: Vehicle loading sequence for each route

## Process

1. Match vehicle capacity and type to each route
2. Assign drivers based on availability and zone familiarity
3. Generate the loading sequence (last stop loaded first)
4. Produce the assignment and load plans

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
