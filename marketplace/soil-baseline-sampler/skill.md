# Soil Baseline Sampler

Collect baseline soil samples across the operation.

## Inputs

- `field-map`: Map of fields with management zones
- `sampling-protocol`: Depth, grid spacing, and lab tests to order

## Outputs

- `baseline-results`: Lab results for all fields
- `zone-variability-map`: Map of nutrient and organic matter variability

## Process

1. Divide fields into management zones based on soil type and topography.
2. Collect samples at specified depths following the grid or zone protocol.
3. Submit samples for analysis (nutrients, pH, organic matter, biology).
4. Map the results to visualize spatial variability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
