# Membership Renewal Handler

Handle membership renewals, status changes, and departures.

## Inputs

- `engagement-metrics`: How engagement is tracked and scored
- `at-risk-criteria`: Thresholds for disengagement

## Outputs

- `renewal-process`: Timeline and steps for annual or periodic membership renewal
- `membership-report`: Summary of active, renewed, lapsed, and departed members

## Process

1. Define the renewal cycle: annual, ongoing, or event-triggered.
2. Send renewal reminders with instructions for updating contact info and confirming continued membership.
3. Process renewals, collect any dues, and update the database status.
4. Handle departures: record the reason if given, remove from active lists, send a departing acknowledgment.
5. Produce the membership report: total active, new this period, renewed, lapsed, departed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
