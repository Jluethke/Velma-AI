# Column Chemistry Selector

Select the stationary phase and column dimensions based on analyte properties.

## Inputs

- `analyte-profile`: Physicochemical properties of each analyte
- `method-requirements`: Performance criteria the method must meet

## Outputs

- `column-selection`: Chosen column type, particle size, dimensions, and rationale
- `separation-mode`: Chromatographic mode (reversed-phase, HILIC, ion exchange, normal phase)

## Process

1. Match analyte polarity and charge state to the appropriate separation mode
2. Select particle size and column dimensions based on throughput and resolution requirements
3. Consider column temperature effects on selectivity
4. Document the rationale for the chosen stationary phase

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
