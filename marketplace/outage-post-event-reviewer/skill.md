# Outage Post Event Reviewer

Conduct the post-outage review and produce the event report.

## Inputs

- `customer-notifications`: Notification and communication records
- `communication-log`: Communication log from the event

## Outputs

- `outage-event-report`: Complete event report with timeline, cause, response actions, and metrics (SAIDI, SAIFI)
- `improvement-actions`: Actions to prevent recurrence or improve response time

## Process

1. Reconstruct the event timeline from detection through full restoration.
2. Calculate reliability metrics: SAIDI (duration), SAIFI (frequency), and CAIDI (average duration).
3. Identify what worked well and what could be improved in detection, dispatch, restoration, and communication.
4. Document the corrective actions to prevent recurrence (vegetation management, equipment replacement, relay coordination).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
