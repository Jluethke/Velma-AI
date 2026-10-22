# Cohort Definition Builder

Define the cohort grouping event, time window, and behavior metric.

## Inputs

- `analysis-question`: What you want to understand
- `available-data`: The data you have

## Outputs

- `cohort-definition`: The grouping event, time window (weekly, monthly), and behavior metric to track
- `cohort-table-structure`: Rows are cohorts by time window, columns are periods since grouping event, cells are the metric

## Process

1. Define the grouping event: sign-up date, first purchase, feature adoption date.
2. Define the time window: weekly (granular, small samples) or monthly (balanced).
3. Define the behavior metric: retention percentage, cumulative spending, sessions per week.
4. Build the table structure: cohorts as rows, age as columns, metric values as cells.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
