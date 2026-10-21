# Climate Trend Tester

Test for statistically significant trends in the anomaly time series.

## Inputs

- `anomaly-series`: Climate anomaly time series

## Outputs

- `trend-results`: Trend magnitude (Sen's slope), p-value (Mann-Kendall), and confidence interval
- `trend-visualization`: Time series plot with trend line and confidence band

## Process

1. Apply the non-parametric Mann-Kendall test for trend significance
2. Estimate the trend magnitude using Sen's slope estimator
3. Compute the 95% confidence interval for the trend
4. Check for autocorrelation and apply correction (modified Mann-Kendall) if present

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
