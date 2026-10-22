# Time Entry Logging

Log time entries against projects and tasks on a daily basis.

## Inputs

- `tracking-configuration`: Time tracking setup details
- `tracking-tool-access`: Access to the tracking tool

## Outputs

- `time-entries`: Logged time entries with date, hours, task, and description
- `running-total`: Running total of hours and billable amount for the period

## Process

1. At the end of each work session, log the time entry with the date, duration, task category, and a brief description of the work done.
2. Review entries against the project budget to check utilization.
3. Flag any non-billable time separately (admin, internal meetings, rework).
4. Verify that descriptions are specific enough for the client to understand the work performed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
