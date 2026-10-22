# Tutoring Session Scheduler

Schedule sessions and manage the calendar across multiple clients.

## Inputs

- `client-profile`: Client availability and session preferences
- `service-offerings`: Session durations and format options

## Outputs

- `session-calendar`: Weekly calendar with all scheduled sessions, clients, and locations
- `reminder-schedule`: Automated reminders sent before each session

## Process

1. Match client availability against tutor/coach open slots.
2. Schedule recurring sessions at consistent times where possible.
3. Set up automated reminders (24 hours and 1 hour before).
4. Handle rescheduling requests within the policy rules.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
