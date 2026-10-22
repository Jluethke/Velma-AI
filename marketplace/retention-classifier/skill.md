# Retention Classifier

Classify existing records against the retention schedule.

## Inputs

- `retention-schedule`: The approved retention schedule

## Outputs

- `classified-records`: Records categorized by retention status (active, eligible for destruction, on hold)
- `classification-summary`: Counts and volumes by retention category

## Process

1. Scan existing records and match to the retention schedule.
2. Calculate the retention expiry date for each record.
3. Identify records eligible for destruction.
4. Flag records under legal hold.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
