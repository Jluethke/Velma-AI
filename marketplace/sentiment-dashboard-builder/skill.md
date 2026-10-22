# Sentiment Dashboard Builder

Build the sentiment tracking dashboard with trend lines and segment breakdowns.

## Inputs

- `sentiment-scores`: Scored sentiment data
- `tracking-scope`: What is being tracked (brand, product, feature)

## Outputs

- `sentiment-dashboard`: The dashboard with overall sentiment trend, source breakdown, and segment views
- `dashboard-refresh-schedule`: How often the dashboard updates (real-time, hourly, daily)

## Process

1. Design the dashboard layout: overall sentiment trend line, sentiment distribution, source breakdown.
2. Add segment views (by product, region, customer tier, time period).
3. Include a feed of the most recent negative items for quick review.
4. Set the refresh schedule based on data volume (real-time for high volume, daily for low).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
