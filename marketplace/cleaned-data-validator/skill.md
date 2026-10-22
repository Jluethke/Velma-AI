# Cleaned Data Validator

Validate the cleaned dataset against business rules and compare quality metrics to the original.

## Inputs

- `cleaned-dataset-location`: Path to the cleaned dataset
- `cleaning-log`: Log of all changes applied

## Outputs

- `validation-results`: Pass/fail on each business rule, plus before/after quality metrics comparison
- `data-cleanup-report`: Summary of what was cleaned, how many records changed, quality improvement metrics, and remaining issues

## Process

1. Re-run the profiling on the cleaned dataset and compare metrics to the original (null rate, duplicate rate, format consistency).
2. Run the business validation rules (required fields populated, referential integrity, value ranges).
3. Compile the cleanup report: issues found, rules applied, records changed, quality improvement, remaining issues.
4. Flag any remaining issues that require manual attention.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
