# Remediation Progress Tracker

Track remediation progress and follow up on overdue items.

## Inputs

- `remediation-assignments`: Assigned vulnerabilities with owners and deadlines
- `remediation-tickets`: Tracking tickets in the system

## Outputs

- `progress-report`: Status of all remediation efforts: completed, in progress, overdue
- `escalation-list`: Overdue items requiring management escalation

## Process

1. Query the ticketing system for remediation status updates
2. Calculate on-time vs overdue rates by team and severity
3. Generate the escalation list for items past their deadline with no progress
4. Send reminders and escalation notifications

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
