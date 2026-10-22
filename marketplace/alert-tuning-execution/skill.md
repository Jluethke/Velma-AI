# Alert Tuning Execution

Tune or remove noisy alerts based on the classification.

## Inputs

- `signal-classification`: Classification of each alert
- `tuning-recommendations`: Specific tuning actions

## Outputs

- `tuning-changelog`: Log of all changes made to alert rules
- `consolidated-alerts`: List of alerts that were merged or consolidated

## Process

1. Apply the tuning recommendations: adjust thresholds, increase evaluation windows, add conditions.
2. Remove or disable the alerts classified as removable.
3. Consolidate related alerts that fire together into a single grouped alert.
4. Log every change in the tuning changelog with the before and after state.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
