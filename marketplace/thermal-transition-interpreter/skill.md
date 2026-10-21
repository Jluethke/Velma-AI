# Thermal Transition Interpreter

Interpret all thermal transitions across DSC, TGA, and DMA data to build a consistent picture of the material's thermal behavior.

## Inputs

- `dsc-parameters`: DSC transition temperatures and enthalpies
- `tga-parameters`: TGA decomposition temperatures and mass losses
- `dma-parameters`: DMA moduli and relaxation temperatures

## Outputs

- `thermal-profile`: Unified thermal property summary with cross-validated transition temperatures
- `discrepancy-notes`: Any conflicts between instruments and likely explanations

## Process

1. Compare Tg values from DSC (midpoint) and DMA (tan delta peak) and note the expected offset.
2. Cross-check decomposition onset from TGA against any exothermic events in DSC.
3. Correlate modulus drop in DMA with the glass transition region from DSC.
4. Flag any unexpected transitions or mass losses that suggest contamination, moisture, or side reactions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
