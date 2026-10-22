# Statistical Forecast Generator

Generate the statistical demand forecast.

## Inputs

- `cleaned-demand-history`: Cleaned historical demand data
- `outlier-report`: Outliers and one-time events identified in the history

## Outputs

- `statistical-forecast`: Baseline statistical forecast by product and period
- `forecast-accuracy-metrics`: Model accuracy metrics (MAPE, bias, tracking signal)

## Process

1. Select the forecasting method per product (exponential smoothing, ARIMA, regression)
2. Generate the baseline forecast by product and period
3. Calculate forecast accuracy metrics against holdout data
4. Document model selection and parameter choices

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
