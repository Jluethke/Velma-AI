# Climate Forcing Attributor

Attribute observed trends to natural and anthropogenic forcing factors.

## Inputs

- `anomaly-series`: Observed climate anomaly series
- `trend-results`: Trend magnitude and significance

## Outputs

- `attribution-results`: Estimated contribution of each forcing factor (GHG, aerosol, solar, volcanic, internal variability)
- `attribution-confidence`: Confidence level for each attribution statement

## Process

1. Compare the observed trend against natural-only and all-forcings model simulations
2. Compute the detection variable (optimal fingerprint or regression scaling factor)
3. Estimate the fraction of the trend attributable to anthropogenic vs natural forcing
4. Assess confidence using the residual consistency test

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
