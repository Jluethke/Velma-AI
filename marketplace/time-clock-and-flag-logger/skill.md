# Time Clock And Flag Logger

Log the clock time (hours present) and flag time (labor hours billed) for each technician.

## Inputs

- `technician-roster`: List of technicians with their schedules
- `reporting-period`: Date range for the productivity report

## Outputs

- `time-records`: Clock hours and flag hours for each technician in the period
- `job-breakdown`: Flag hours broken down by job type (maintenance, repair, diagnostic, warranty)

## Process

1. Pull the clock-in and clock-out times for each technician in the period.
2. Pull the flag hours (labor billed) from the completed work orders in the period.
3. Break down the flag hours by job type for each technician.
4. Exclude non-productive time (training, shop meetings, cleaning) from the clock hours if tracked separately.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
