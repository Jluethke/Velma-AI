# Data Quality Assurance

Apply QA/QC protocols to environmental monitoring data including range checks, drift correction, gap filling, and flagging.

## Inputs

- `raw-data`: Incoming sensor data streams with timestamps and station identifiers
- `calibration-log`: Instrument calibration records and maintenance events
- `quality-criteria`: Acceptable ranges, drift thresholds, and completeness requirements

## Outputs

- `qc-dataset`: Cleaned dataset with quality flags on each measurement
- `completeness-report`: Data recovery rate per station and parameter
- `drift-corrections`: Applied calibration drift corrections with before/after values

## Process

1. Apply automated range checks to flag physically impossible values
2. Detect and correct instrument drift using calibration records
3. Identify data gaps and apply approved gap-filling methods where appropriate
4. Flag suspect values for manual review without removing them from the dataset
5. Calculate data recovery rates and document all QA/QC actions taken

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
