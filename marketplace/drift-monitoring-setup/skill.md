# Drift Monitoring Setup

Set up automated drift monitoring on production data.

## Inputs

- `drift-tests`: Statistical tests to run
- `production-data-source`: Where to collect production predictions and inputs

## Outputs

- `monitoring-pipeline`: Automated drift monitoring pipeline
- `drift-dashboard`: Dashboard showing drift metrics over time

## Process

1. Configure the data collection from production (predictions, inputs, ground truth).
2. Schedule drift tests at regular intervals (hourly, daily, weekly).
3. Build the drift dashboard with time series for each metric.
4. Set window sizes for comparison (daily vs weekly vs monthly).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
