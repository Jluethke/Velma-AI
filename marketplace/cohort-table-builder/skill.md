# Cohort Table Builder

Build the cohort table: rows are cohorts, columns are time periods since entry, cells are the metric value. This is the core data structure. Reading down a column shows how different cohorts compare at the same age. Reading across a row shows how one cohort evolves over time.

## Inputs

- `cohort-dimension`: The field defining cohorts
- `cohort-metric`: The metric to track per cohort

## Outputs

- `cohort-table`: The table: rows = cohorts, columns = periods since entry, cells = metric value
- `cohort-sizes`: The number of members in each cohort (for weighting and significance)

## Process

1. Group all entities by the cohort dimension. For each cohort, calculate the metric at each time period since entry (month 0, month 1, month 2, etc.).
2. Record the cohort size (number of members at entry). Smaller cohorts produce noisier curves and should be interpreted with more caution.
3. Fill the table. Recent cohorts will have fewer columns (they have not aged as far). This is expected and correct.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
