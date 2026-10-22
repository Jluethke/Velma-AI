# Cohort Data Puller

Pull and prepare the cohort data.

## Inputs

- `cohort-definition`: How to group users
- `analysis-parameters`: What to measure and at what granularity

## Outputs

- `cohort-dataset`: Structured data with cohort, time period, and metric value
- `data-quality-notes`: Any issues with the data (missing periods, small cohorts)

## Process

1. Write and run the query to pull user-level data with cohort assignments.
2. Aggregate to the cohort and time period level.
3. Check for data quality issues: missing periods, cohorts with fewer than 30 users.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
