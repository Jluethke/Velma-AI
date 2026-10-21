# Stationarity Tester

Test whether the time series is stationary: constant mean, constant variance, and no trend over time.

## Inputs

- `cleaned-series`: The cleaned time series

## Outputs

- `stationarity-result`: Test results (ADF, KPSS, or both) with interpretation
- `differencing-recommendation`: How many differences are needed to achieve stationarity, if any

## Process

1. Run the Augmented Dickey-Fuller test for the presence of a unit root.
2. Run the KPSS test for the null of stationarity (confirmatory, opposite null).
3. If non-stationary, determine the order of differencing needed.
4. Report the results and the recommended transformation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
