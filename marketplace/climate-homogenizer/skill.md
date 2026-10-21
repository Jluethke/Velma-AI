# Climate Homogenizer

Homogenize the time series to remove artificial discontinuities from station moves, instrument changes, or observation practice changes.

## Inputs

- `raw-climate-series`: Time series with QC flags
- `station-metadata`: Station history (moves, instrument changes, observer changes)

## Outputs

- `homogenized-series`: Adjusted time series with breakpoints corrected
- `homogenization-log`: Breakpoints detected, adjustment magnitudes, and method used

## Process

1. Detect breakpoints using relative homogeneity tests against neighboring stations
2. Cross-reference detected breaks with station metadata for physical cause
3. Adjust the earlier segment to align with the most recent observation practice
4. Document each adjustment with its magnitude and uncertainty

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
