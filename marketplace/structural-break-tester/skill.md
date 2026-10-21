# Structural Break Tester

Test for structural breaks: points where the data-generating process changed (regime shifts, level shifts, slope changes).

## Inputs

- `cleaned-series`: The time series
- `residual-component`: Residuals from the decomposition

## Outputs

- `break-points`: Detected structural break locations with confidence intervals
- `regime-descriptions`: How the series differs before and after each break

## Process

1. Apply a structural break test (Chow, Bai-Perron, or CUSUM) to the residuals.
2. For each detected break, estimate its location and confidence interval.
3. Describe how the series parameters (mean, variance, trend slope) differ across regimes.
4. Check whether detected breaks correspond to known external events.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
