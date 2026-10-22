# Quality Data Collection

Collect the clinical data needed to calculate the selected quality measures.

## Inputs

- `selected-measures`: Measures with definitions and data requirements
- `reporting-year`: Reporting period

## Outputs

- `measure-data`: Extracted clinical data organized by measure (eligible population, numerator events, exclusions)
- `data-quality-issues`: Data gaps or quality problems that could affect measure performance

## Process

1. Extract the eligible patient population for each measure from the EHR.
2. Identify the numerator events (patients who received the recommended care).
3. Apply the exclusion criteria.
4. Flag any data quality issues (missing documentation, incomplete records).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
