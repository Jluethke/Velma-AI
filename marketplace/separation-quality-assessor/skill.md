# Separation Quality Assessor

Assess the quality of the chromatographic separation: resolution between critical pairs, plate count, peak capacity, and system suitability.

## Inputs

- `peak-list`: Detected peaks with shape parameters
- `method-parameters`: Column and method specifications

## Outputs

- `separation-metrics`: Resolution between adjacent peaks, plate count, peak capacity
- `suitability-verdict`: Pass/fail against system suitability criteria

## Process

1. Compute resolution (Rs) between every adjacent peak pair.
2. Identify critical pairs (Rs < 2.0) that may need method adjustment.
3. Calculate the average plate count and peak capacity of the column.
4. Check system suitability criteria: replicate precision, plate count, tailing factor limits.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
