# Demand Forecaster

Forecast future capacity demand based on business plans.

## Inputs

- `utilization-data`: Current utilization metrics
- `utilization-baselines`: Baseline utilization levels

## Outputs

- `demand-forecast`: Projected capacity needs for the next 12 months
- `growth-assumptions`: Business growth assumptions used in the forecast

## Process

1. Collect business growth plans (new users, applications, regions).
2. Model the capacity impact of each growth driver.
3. Project utilization forward at 3, 6, and 12 month intervals.
4. Document the assumptions behind each projection.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
