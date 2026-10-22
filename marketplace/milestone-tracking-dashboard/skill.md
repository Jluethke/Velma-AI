# Milestone Tracking Dashboard

Track milestone progress visually: what has been verified, what is upcoming, and what is at risk.

## Inputs

- `milestone-gates`: The gates with pass/fail criteria
- `gate-schedule`: The scheduled gate dates

## Outputs

- `milestone-dashboard`: A visual tracker: each milestone with its scheduled date, actual date, and status (passed, upcoming, at risk, failed)
- `milestone-trends`: Are milestones being hit on time? Is the slip trend increasing or decreasing? How many milestones have failed their first gate attempt?

## Process

1. Build the dashboard: one row per milestone, columns for scheduled date, actual date (if passed), status, and the key metric or evidence for the pass.
2. Color-code: green (passed), yellow (upcoming, on track), orange (upcoming, at risk of missing), red (missed or failed).
3. Track trends: are milestones slipping? If each milestone slips further than the last, the project is decelerating. This is the earliest warning of a troubled project.
4. Report the dashboard weekly as part of the project status. Milestones are the most meaningful progress indicator because they verify outcomes, not activities.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
