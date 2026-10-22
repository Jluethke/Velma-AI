# Submittal Log Reporter

Produce the submittal log report with status and metrics.

## Inputs

- `distribution-log`: Log of distributed submittals
- `resubmittal-list`: Submittals requiring resubmission

## Outputs

- `submittal-log-report`: Complete submittal log with status and metrics
- `submittal-metrics`: Metrics on submittal volume, turnaround time, and approval rates

## Process

1. Compile all submittals into the log report format.
2. Calculate metrics (total, approved, pending, rejected, average turnaround time).
3. Flag any submittals that are on the critical path.
4. Distribute the report to the project team.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
