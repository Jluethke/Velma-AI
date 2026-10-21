# Process Variable Compilation

Compile and preprocess the process variable matrix from historical normal operating data.

## Inputs

- `process-data-sources`: Historian databases, sensor logs, or batch records for the process
- `variable-selection`: List of process variables to include and their engineering units

## Outputs

- `process-matrix`: Cleaned, aligned time-series matrix of process variables for the reference period
- `variable-metadata`: Variable names, units, ranges, and any known correlations

## Process

1. Extract time-aligned process variable data from the historian for the reference (normal) period
2. Handle missing values by interpolation or exclusion based on gap length
3. Remove known abnormal periods (shutdowns, upsets, calibrations) from the reference dataset
4. Auto-scale each variable to zero mean and unit variance

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
