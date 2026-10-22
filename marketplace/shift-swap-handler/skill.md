# Shift Swap Handler

Handle shift swap requests, callouts, and schedule changes after publication.

## Inputs

- `draft-schedule`: The published schedule
- `schedule-violations`: Known issues in the schedule

## Outputs

- `swap-log`: Record of all swap requests with outcomes (approved, denied, pending)
- `schedule-change-record`: All post-publication changes to the schedule

## Process

1. Receive the swap request (employee A wants to trade shift X with employee B's shift Y).
2. Validate: both employees are qualified for the other's shift, no rule violations result from the swap.
3. If valid, approve and update the schedule. Notify both employees.
4. For callouts (sick, emergency), find a replacement from the on-call list or offer the shift to all qualified staff.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
