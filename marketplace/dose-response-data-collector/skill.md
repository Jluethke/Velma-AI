# Dose Response Data Collector

Organize dose and response data, check for outliers, and prepare the dataset for modeling.

## Inputs

- `raw-dose-response-data`: Table of dose levels and corresponding response measurements
- `response-type`: Continuous, binary, or count

## Outputs

- `cleaned-data`: Validated dose-response dataset with outliers flagged
- `data-summary`: Dose levels, replicates per dose, response range, and outlier report

## Process

1. Import the raw data and verify dose and response columns.
2. Check for missing values and flag statistical outliers (Grubbs or IQR).
3. Summarize the number of replicates at each dose level.
4. Report the response range and any data quality issues.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
