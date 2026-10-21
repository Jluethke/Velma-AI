# Pk Data Compilation

Compile drug concentration-time data from dosing studies, merge with dosing records, and assess data quality.

## Inputs

- `concentration-time-data`: Measured drug concentrations at sampled time points
- `dosing-records`: Dose amounts, routes, and timing for each subject

## Outputs

- `pk-dataset`: Merged concentration-time-dose dataset ready for modeling
- `data-quality-flags`: Flagged outliers, BLQ values, and missing time points

## Process

1. Merge concentration measurements with dosing records by subject and time.
2. Handle below-the-limit-of-quantification (BLQ) values using an appropriate method (LLOQ/2, likelihood-based).
3. Identify and flag potential outliers based on concentration-time profile inspection.
4. Plot individual concentration-time profiles on a semi-log scale for visual assessment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
