# Wq Physical Params

Measure physical water quality parameters: temperature, turbidity, conductivity, and color.

## Inputs

- `collected-samples`: Water samples and in-situ measurements

## Outputs

- `physical-results`: Temperature, turbidity (NTU), conductivity (uS/cm), TDS, and true color
- `physical-status`: Each parameter rated against applicable standards

## Process

1. Record temperature from field measurement (within 15 minutes of collection).
2. Measure turbidity by nephelometry.
3. Measure specific conductance at 25C and calculate total dissolved solids.
4. Measure true color on a filtered sample.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
