# Earned Value And Field Execution

Track schedule performance during construction using earned value management and manage field execution with look-ahead schedules.

## Inputs

- `resource-loaded-schedule`: Baseline schedule with cost and resource loading
- `resource-plan`: Planned labor, equipment, and material procurement

## Outputs

- `performance-metrics`: SPI, CPI, and EAC at each reporting period with trend analysis
- `recovery-actions`: Schedule recovery plan if behind, with specific actions, revised dates, and resource adjustments

## Process

1. Update schedule at regular intervals (weekly for active construction, bi-weekly for early stages). Record: actual start and finish dates, remaining duration for in-progress activities, percent complete based on quantity installed (not time elapsed). Recalculate CPM with actuals to get projected completion date.
2. Calculate earned value metrics. BCWS (Planned Value, PV): budgeted cost of work scheduled to date. BCWP (Earned Value, EV): budgeted cost of work actually performed to date. ACWP (Actual Cost, AC): actual cost incurred to date. SPI = EV/PV (< 1.0 means behind schedule). CPI = EV/AC (< 1.0 means over budget). EAC (Estimate at Completion) = BAC/CPI for systemic overruns, or AC + ETC for re-estimated remaining work.
3. Three-week look-ahead schedule. Extract activities planned to start or be in progress during the next three weeks. Break into daily or shift-level tasks. Assign specific crews and equipment. Identify constraints: preceding work completion, material availability, inspection holds, weather. Resolve constraints before the work week starts. This is the foreman's working schedule.
4. Monitor critical path. If critical path activities fall behind, the project completion date slips. Recovery options: increase crews on critical activities, work overtime (productivity drops 10% for 50-hour week, 20% for 60-hour), re-sequence to create parallel work, change construction method. Document delays: contemporaneous recording of delay events, categorize as excusable (weather, owner changes) or non-excusable (contractor performance).
5. Prepare monthly schedule narrative. Compare progress to baseline. Explain variances: causes of delay or acceleration. Show status of critical and near-critical paths. Present 3-month rolling forecast. If behind, present recovery plan with specific actions and revised completion date. This narrative supports progress payment applications and delay claims.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
