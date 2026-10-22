# Volunteer Substitution Handler

Handle no-shows, cancellations, and last-minute substitutions.

## Inputs

- `confirmation-log`: Who confirmed and who declined
- `reminder-schedule`: Reminder timing for upcoming shifts

## Outputs

- `substitution-log`: Record of swaps, no-shows, and how each was resolved
- `updated-schedule`: The schedule with all substitutions applied

## Process

1. When a volunteer cancels, search the available roster for a qualified substitute.
2. Contact potential substitutes in priority order (least recent service, closest match).
3. Log the substitution: original volunteer, reason, substitute, and confirmation.
4. If no substitute is found, notify the event coordinator to adjust the plan.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
