# Data Profiling Analyzer

Profile the dataset to identify quality issues: null rates, duplicates, format inconsistencies, outliers, and type mismatches.

## Inputs

- `dataset-location`: Path or connection string to the dataset to clean
- `expected-schema`: Expected column names, types, and value ranges

## Outputs

- `profiling-report`: Per-column statistics: null rate, duplicate rate, distinct count, min/max, format distribution, outlier count
- `issue-inventory`: Categorized list of data quality issues found

## Process

1. Compute basic statistics for each column: row count, null count, distinct values, min, max, mean (numeric), mode.
2. Check for duplicate rows and near-duplicate rows (fuzzy match on key fields).
3. Identify format inconsistencies within each column (mixed date formats, inconsistent casing, trailing whitespace).
4. Flag outliers using statistical methods (z-score, IQR) for numeric columns.
5. Compile the profiling report and issue inventory.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
