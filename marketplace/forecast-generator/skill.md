# Forecast Generator

Forecast the series forward with uncertainty bands: fit a model that respects the decomposition and any structural breaks.

## Inputs

- `trend-component`: The trend
- `seasonal-component`: The seasonal pattern
- `break-points`: Any detected structural breaks

## Outputs

- `forecast`: Point forecasts for the specified horizon
- `prediction-intervals`: Uncertainty bands (e.g., 80% and 95%) around each forecast point

## Process

1. Select a forecasting model that incorporates trend, season, and any regime structure.
2. Fit the model to the historical data (or the most recent regime if a break exists).
3. Generate point forecasts and prediction intervals for the desired horizon.
4. Check whether the forecast envelope is physically plausible.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
