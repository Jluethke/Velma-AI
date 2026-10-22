# Demand Pattern Analyzer

Identify seasonal patterns, trends, and demand drivers in sales history.

## Inputs

- `sales-history`: Cleaned historical sales data
- `data-quality-notes`: Notes on anomalies

## Outputs

- `demand-patterns`: Identified seasonality, trends, and demand drivers
- `forecast-model`: Selected forecasting model and parameters

## Process

1. Decompose the time series into trend, seasonal, and residual components.
2. Identify the seasonal pattern (weekly, monthly, annual cycles).
3. Test forecasting methods (moving average, exponential smoothing, regression).
4. Select the best model based on forecast accuracy metrics (MAPE, MAE).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
