# Behavioral Summary Metrics

Compute summary metrics per subject per condition for use in the group-level analysis.

## Inputs

- `validated-trials`: Cleaned trial-level data

## Outputs

- `subject-summaries`: Mean RT, accuracy, and other metrics per subject per condition
- `outlier-report`: Subjects flagged for low accuracy or extreme RT distributions

## Process

1. Remove trials flagged as anticipatory or excessively slow.
2. Compute mean and median reaction time per subject per condition (on correct trials only).
3. Compute accuracy (proportion correct) per subject per condition.
4. Flag subjects whose overall accuracy falls below chance or whose mean RT is more than 3 SD from the group mean.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
