# Data Collection Protocol Builder

Build a data collection plan with instrument specifications, recording formats, quality checks, and a schedule.

## Inputs

- `experiment-protocol`: The experimental procedure to collect data for
- `variable-definitions`: What needs to be measured and how

## Outputs

- `collection-plan`: Instrument list, recording format, schedule, and chain-of-custody rules
- `quality-check-criteria`: Acceptance thresholds, outlier rules, and calibration schedule
- `raw-data-schema`: Column definitions, units, and expected ranges for the dataset

## Process

1. List every measurement and match it to an instrument or method
2. Define the recording format, units, precision, and storage location
3. Set calibration intervals and quality acceptance thresholds
4. Build the collection schedule aligned to the experiment timeline

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
