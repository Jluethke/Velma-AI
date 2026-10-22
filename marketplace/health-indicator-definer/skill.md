# Health Indicator Definer

Define the health indicators and their data sources.

## Inputs

- `customer-data-sources`: Available data (usage, tickets, billing, engagement)
- `churn-history`: Historical churn data with reasons

## Outputs

- `indicator-catalog`: Health indicators with definitions and data sources
- `churn-correlations`: Which indicators correlate most with churn

## Process

1. Inventory available customer data signals.
2. Analyze which signals correlate with churn and expansion.
3. Select the indicators to include in the score.
4. Document each indicator with its definition and data source.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
