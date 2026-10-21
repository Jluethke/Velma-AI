# Spatial Report Producer

Produce the spatial analysis report: maps, variogram analysis, prediction surface, uncertainty map, and interpretation.

## Inputs

- `prediction-surface`: Interpolated map
- `kriging-variance`: Uncertainty map
- `cv-metrics`: Validation results

## Outputs

- `spatial-report`: Structured report with maps, statistics, and interpretation
- `data-collection-guidance`: Where to sample next to reduce prediction uncertainty

## Process

1. Present the observation map, prediction map, and uncertainty map side by side.
2. Summarize the variogram analysis: correlation range, nugget ratio, and anisotropy.
3. Report validation metrics and whether the model is adequately calibrated.
4. Identify high-uncertainty areas and recommend additional sampling locations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
