# Rfi Log Reporter

Produce the RFI log report with status metrics.

## Inputs

- `distribution-confirmation`: Confirmation of response distribution
- `response-status`: Status of all RFIs

## Outputs

- `rfi-log-report`: Complete RFI log with status and metrics
- `rfi-metrics`: Metrics on RFI volume, response time, and open items

## Process

1. Compile all RFIs into the log report.
2. Calculate metrics (total, open, closed, average response time, overdue count).
3. Identify trends in RFI volume by trade or subject area.
4. Distribute the log report to the project team.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
