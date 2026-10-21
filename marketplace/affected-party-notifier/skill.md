# Affected Party Notifier

Notify affected parties including downstream vendors, customers, and the reporter.

## Inputs

- `security-advisory`: Advisory text
- `fix-timeline`: Fix and release dates
- `reporter-contact`: Reporter contact information

## Outputs

- `notification-log`: Record of all parties notified with dates
- `reporter-update`: Final update sent to the reporter

## Process

1. Notify the reporter of the fix and advisory date, offer credit
2. Notify downstream vendors and partners under embargo if needed
3. Prepare customer notification for the release date
4. Coordinate with CERT/CC or other coordinators if the scope is broad

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
