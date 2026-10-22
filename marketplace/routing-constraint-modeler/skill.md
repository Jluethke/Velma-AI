# Routing Constraint Modeler

Model all constraints that affect route feasibility.

## Inputs

- `geocoded-points`: Geocoded delivery points
- `point-constraints`: Per-point constraints

## Outputs

- `constraint-model`: Complete constraint set (vehicle capacity, driver hours, time windows, road restrictions)
- `vehicle-fleet`: Available vehicles with capacity, type, and home base location

## Process

1. Define vehicle constraints (weight capacity, volume, refrigeration, tail lift).
2. Define driver constraints (hours of service, break requirements, certifications).
3. Map road restrictions (weight limits, height clearances, time-of-day closures).
4. Compile the full constraint model for the optimizer.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
