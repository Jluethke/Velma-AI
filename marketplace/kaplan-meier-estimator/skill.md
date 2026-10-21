# Kaplan Meier Estimator

Estimate the survival function using the Kaplan-Meier method: step function, confidence bands, and median survival time.

## Inputs

- `survival-dataset`: Time, event indicator, and group variable
- `confidence-level`: Desired confidence level for the survival bands (e.g., 95%)

## Outputs

- `km-curves`: Kaplan-Meier survival curves by group with confidence bands
- `km-summary`: Median survival, restricted mean survival time, and survival at landmark times

## Process

1. Compute the KM estimator: product of conditional survival probabilities at each event time.
2. Compute Greenwood confidence intervals at each time point.
3. Extract the median survival time (where the curve crosses 0.50) with its CI.
4. Report survival probability at clinically relevant landmark times.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
