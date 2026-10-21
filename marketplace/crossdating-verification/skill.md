# Crossdating Verification

Crossdate each sample series against the master chronology to verify that every ring is assigned to the correct calendar year.

## Inputs

- `raw-ring-widths`: Measured ring-width series for all samples
- `master-chronology`: Existing site or regional master chronology for the species

## Outputs

- `crossdated-series`: Ring-width series with verified calendar year assignments
- `crossdating-statistics`: Correlation statistics, t-values, and flagged segments for each sample

## Process

1. Run COFECHA or equivalent to compute segment correlations against the master chronology
2. Identify segments with low correlation and check visually for missing or false rings
3. Insert or remove rings as needed and re-verify until all segments pass quality thresholds
4. Document all dating corrections with justification

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
