# Session History Tracker

Track session history, notes, and progress for the client.

## Inputs

- `session-cadence`: The recurring session schedule
- `session-package`: Package or subscription details

## Outputs

- `session-log`: Running log of completed sessions with date, duration, key topics, and action items
- `package-usage`: Sessions used, sessions remaining, next renewal or expiration date

## Process

1. After each session, record the date, actual duration, key topics discussed, and action items assigned.
2. Track progress toward the client's stated goals.
3. Update the package usage count (sessions used, remaining, expiration warning if nearing the end).
4. Flag when a client is due for a progress review or package renewal.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
