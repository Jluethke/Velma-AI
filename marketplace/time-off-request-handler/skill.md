# Time Off Request Handler

Handle time-off requests and approvals against the master calendar.

## Inputs

- `master-calendar`: The current master availability calendar
- `coverage-gaps`: Existing coverage gaps

## Outputs

- `time-off-decisions`: Approved and denied time-off requests with rationale
- `updated-calendar`: Master calendar updated with approved time off

## Process

1. Receive the time-off request (dates, reason, partial or full day).
2. Check coverage impact: will the absence create a gap below minimum staffing?
3. If coverage is adequate, approve and update the calendar. If not, check for volunteers or swaps.
4. Notify the requester of the decision and update the master calendar.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
