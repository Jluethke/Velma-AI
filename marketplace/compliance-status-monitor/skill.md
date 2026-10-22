# Compliance Status Monitor

Monitor completion status and escalate overdue items.

## Inputs

- `assigned-obligations`: Obligations with owners and deadlines
- `accountability-matrix`: RACI matrix

## Outputs

- `compliance-dashboard`: Current status of all obligations (complete, in progress, overdue, upcoming)
- `escalation-report`: Overdue or at-risk items with escalation actions taken

## Process

1. Track completion as owners mark obligations done.
2. Send reminders for upcoming deadlines.
3. Escalate overdue items to the owner's manager and to the compliance officer.
4. Produce the compliance dashboard and escalation report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
