# Thermal Analysis Runner

Run thermal analysis (DSC, TGA, DMA) to identify phase transitions, decomposition temperatures, and thermal stability windows.

## Inputs

- `material-description`: Composition and expected thermal behavior
- `xrd-results`: Phases present that may undergo transitions

## Outputs

- `thermal-results`: Transition temperatures, enthalpies, mass loss steps, and glass transition data
- `thermal-curves`: Annotated DSC, TGA, and DMA curves
- `stability-window`: Safe operating temperature range with degradation onset

## Process

1. Select techniques based on expected behavior (DSC for transitions, TGA for decomposition, DMA for viscoelastic)
2. Set heating rate, atmosphere, and temperature range
3. Run samples and reference/baseline in parallel
4. Identify transition onsets, peaks, and mass loss steps from the curves

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
