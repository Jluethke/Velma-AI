# Cleaning Rule Executor

Apply the cleaning rules to the dataset in the defined order.

## Inputs

- `cleaning-rules`: Ordered cleaning operations
- `dataset-location`: Path or connection to the dataset

## Outputs

- `cleaned-dataset-location`: Path or connection to the cleaned dataset
- `cleaning-log`: Record of every change made: row, column, old value, new value, rule applied

## Process

1. Back up the original dataset before making changes.
2. Apply the cleaning rules in priority order, logging each change.
3. Track the number of rows and fields affected by each rule.
4. Save the cleaned dataset to the target location.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
