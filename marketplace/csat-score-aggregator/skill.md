# Csat Score Aggregator

Aggregate CSAT scores by touchpoint, segment, product, and team.

## Inputs

- `csat-automation-config`: The active survey automation configuration
- `touchpoint-ownership`: Team ownership of each touchpoint

## Outputs

- `csat-scorecard`: Aggregated scores by touchpoint, segment, product, and team
- `score-trends`: Score trends over time with period-over-period comparison

## Process

1. Collect responses from all active touchpoints into a single data store.
2. Calculate the CSAT score for each touchpoint (percent satisfied out of total responses).
3. Break down scores by customer segment, product line, and responsible team.
4. Compare current period scores to prior period and flag significant changes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
