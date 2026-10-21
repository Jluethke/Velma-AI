# Trend Seasonal Decomposer

Decompose the series into trend, seasonal, and residual components using an appropriate method (classical, STL, or MSTL).

## Inputs

- `cleaned-series`: The cleaned time series
- `stationarity-result`: Whether differencing is needed

## Outputs

- `trend-component`: The extracted trend
- `seasonal-component`: The extracted seasonal pattern(s)
- `residual-component`: What remains after trend and season are removed

## Process

1. Choose between additive and multiplicative decomposition based on variance behavior.
2. Select the decomposition method: classical for simple cases, STL for irregular or multiple seasons.
3. Extract the trend, seasonal, and residual components.
4. Verify: trend + seasonal + residual should reconstruct the original series.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
