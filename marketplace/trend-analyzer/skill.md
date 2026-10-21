# Trend Analyzer

Detect long-term trends in environmental time series using statistical methods appropriate for autocorrelated and seasonal data.

## Inputs

- `qc-dataset`: Quality-controlled environmental monitoring data
- `time-range`: Analysis period and temporal resolution (hourly, daily, monthly)
- `covariates`: Meteorological or other variables that may confound trend detection

## Outputs

- `trend-results`: Estimated trend magnitudes with confidence intervals and statistical significance
- `seasonal-patterns`: Decomposed seasonal cycles and their year-to-year variation
- `change-points`: Detected abrupt shifts in the time series with estimated timing

## Process

1. Decompose each time series into trend, seasonal, and residual components
2. Apply Mann-Kendall or Sen slope estimator for monotonic trend detection
3. Test for change points using CUSUM or Pettitt test
4. Adjust for meteorological covariates to isolate anthropogenic signal
5. Report trend magnitudes per year with 95% confidence intervals

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
