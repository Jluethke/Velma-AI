# Hold Reminder Scheduler

Send periodic reminders to custodians to maintain the hold.

## Inputs

- `acknowledgment-status`: Current acknowledgment status
- `hold-scope`: Scope of the hold for reminder content

## Outputs

- `reminder-log`: Log of all reminders sent with dates and recipients
- `hold-compliance-status`: Overall compliance status of the hold

## Process

1. Schedule periodic reminders (quarterly or as required by policy).
2. Send the reminder to all active custodians reaffirming the preservation obligation.
3. Track any custodian departures or role changes and update the hold accordingly.
4. Produce the hold compliance status report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
