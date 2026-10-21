# Trial Plot Randomization

Design the field layout with appropriate experimental design (RCBD, alpha-lattice, augmented) and generate the randomization plan.

## Inputs

- `selected-entries`: Entries and checks to include in the trial
- `field-dimensions`: Available field area, row spacing, and plot size constraints

## Outputs

- `randomization-plan`: Plot map with entry assignments, replicate structure, and blocking
- `planting-guide`: Row-by-row planting sequence with seed amounts per plot

## Process

1. Select experimental design based on entry count and field heterogeneity (RCBD for <30, alpha-lattice for larger)
2. Generate randomization with appropriate blocking and guard rows
3. Produce the plot map with GPS coordinates for each plot corner
4. Calculate seed requirements per plot including a 10% buffer

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
