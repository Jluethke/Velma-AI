# Panel Registry Manager

Maintain the panel registry with member profiles, participation history, and incentive balance.

## Inputs

- `recruited-members`: Panel members with segment tags and contact info

## Outputs

- `panel-registry`: The active panel registry with profiles, history, and incentive balances
- `panel-health-metrics`: Active rate, attrition rate, and segment balance

## Process

1. Store each member's profile (segment, demographics, contact, consent status).
2. Track participation history (sessions attended, last participation date, total incentive paid).
3. Update incentive balances after each session and process payouts on schedule.
4. Flag inactive members (no participation in 6 months) and remove opted-out members.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
