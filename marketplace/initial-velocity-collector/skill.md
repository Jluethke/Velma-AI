# Initial Velocity Collector

Collect initial velocity data across the substrate concentration range.

## Inputs

- `assay-protocol`: Complete assay protocol
- `substrate-range`: Substrate concentrations to test

## Outputs

- `velocity-data`: Initial velocity at each substrate concentration (replicated)
- `progress-curves`: Full time courses to verify linearity of the initial rate region

## Process

1. Run the assay at each substrate concentration in at least triplicate
2. Record the full progress curve (product vs time) for each reaction
3. Determine the initial velocity from the linear portion of each progress curve
4. Flag any substrate concentrations where the progress curve is not linear

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
