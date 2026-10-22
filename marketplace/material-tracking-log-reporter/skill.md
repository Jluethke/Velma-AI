# Material Tracking Log Reporter

Produce the material tracking log with procurement metrics.

## Inputs

- `receipt-record`: Materials received with inspection results
- `backorder-list`: Backordered or delayed materials

## Outputs

- `material-tracking-log`: Complete material tracking log
- `procurement-metrics`: Metrics on procurement lead time, on-time delivery, and rejection rate

## Process

1. Compile all procurement data into the tracking log.
2. Calculate metrics (on-time delivery rate, rejection rate, average lead time).
3. Flag materials still outstanding that could impact the schedule.
4. Distribute the log to the project team.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
