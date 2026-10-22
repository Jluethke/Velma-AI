# Social Data Collector

Collect performance data across all social platforms.

## Inputs

- `platforms-list`: The social platforms to pull data from
- `review-period`: The time period to analyze (e.g., last 30 days, last quarter)

## Outputs

- `raw-performance-data`: Performance data per platform (reach, impressions, engagement, followers, clicks, conversions)
- `prior-period-data`: The same metrics from the prior period for comparison

## Process

1. Pull performance metrics from each platform's native analytics.
2. Collect the same metrics for the prior comparison period.
3. Normalize the data into a consistent format across platforms.
4. Flag any data gaps or anomalies.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
