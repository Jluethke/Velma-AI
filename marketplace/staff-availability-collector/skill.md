# Staff Availability Collector

Collect staff availability and schedule preferences for the upcoming period.

## Inputs

- `staffing-minimums`: Required staff by classroom and time block

## Outputs

- `availability-matrix`: Each staff member's available days and times for the scheduling period
- `time-off-requests`: Approved and pending time-off requests

## Process

1. Send the availability request to all staff for the upcoming schedule period.
2. Collect availability submissions (available days, preferred hours, blackout dates).
3. Process any new time-off requests against the coverage needs.
4. Compile the availability matrix showing who is available for each time block.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
