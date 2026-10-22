# Route Optimizer Engine

Run the optimization algorithm to generate candidate routes.

## Inputs

- `constraint-model`: Complete constraint set
- `vehicle-fleet`: Available vehicles

## Outputs

- `candidate-routes`: Set of optimized routes with stop sequences, estimated times, and distances
- `optimization-metrics`: Total distance, total time, vehicle utilization, constraint violations

## Process

1. Select the algorithm based on problem size (nearest neighbor for small, savings algorithm for medium, metaheuristic for large).
2. Run the optimizer with all constraints.
3. Generate multiple candidate solutions and select the best by total cost.
4. Validate that all constraints are satisfied in the selected solution.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
