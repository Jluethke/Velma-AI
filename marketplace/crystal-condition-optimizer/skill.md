# Crystal Condition Optimizer

Optimize crystallization conditions around the best hits.

## Inputs

- `hit-list`: Initial hit conditions to optimize around
- `concentrated-sample`: Fresh sample for optimization plates

## Outputs

- `optimized-conditions`: Fine-screened conditions that produce the largest, best-shaped crystals
- `optimization-grid`: pH, precipitant concentration, and additive variations tested

## Process

1. Design a grid screen around each hit varying pH, precipitant concentration, and drop ratio
2. Test additives (salts, small molecules, detergents) for crystal improvement
3. Set up seeding experiments if nucleation is the bottleneck
4. Select the conditions producing the largest single crystals with good morphology

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
