# Mobile Phase Optimizer

Optimize the mobile phase composition for the best separation of target analytes.

## Inputs

- `column-selection`: Chosen column type and dimensions
- `separation-mode`: Chromatographic mode selected
- `analyte-profile`: Physicochemical properties of each analyte

## Outputs

- `mobile-phase-composition`: Solvents, buffers, pH, and additives for the mobile phase
- `gradient-program`: Gradient or isocratic conditions with time program

## Process

1. Select the organic modifier and aqueous component based on separation mode
2. Screen buffer systems and pH values to control analyte ionization
3. Run scouting gradients to map retention behavior across solvent strength
4. Optimize the gradient slope and hold times for critical pairs

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
