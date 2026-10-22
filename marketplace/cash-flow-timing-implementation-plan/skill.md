# Cash Flow Timing Implementation Plan

Produce the implementation plan: which payments to reschedule, which auto-pays to change, and the monitoring cadence.

## Inputs

- `shift-recommendations`: The specific outflows to move and their target days
- `optimized-balance-curve`: The expected balance curve after shifts
- `float-windows`: The float opportunities identified

## Outputs

- `implementation-checklist`: Action items: which auto-pays to change, which bill pay dates to adjust, which invoices to time differently
- `cash-flow-timing-report`: The complete timing engine report: current vs. optimized balance curves, valley improvements, float opportunities, and monitoring schedule

## Process

1. For each shift recommendation, write the specific action: log into the auto-pay portal and change the date, or set a calendar reminder to pay on the new target day, or contact the vendor to adjust the billing cycle.
2. For each float window, write the action: set up an automatic sweep to a higher-yield account on the first day of the window, and an automatic sweep back one day before the next valley.
3. Define the monitoring cadence: review the actual balance curve against the optimized curve weekly for the first month, then monthly. Flag any new recurring charge that lands on a valley day.
4. Produce the final report showing the before and after balance curves, the specific changes made, the expected improvement in valley depth, and the float dollars put to work.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
