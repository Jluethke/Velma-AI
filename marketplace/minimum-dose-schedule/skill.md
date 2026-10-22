# Minimum Dose Schedule

Schedule the starting dose into the week in a way you can sustain, because a dose that does not fit the calendar is not a real dose.

## Inputs

- `starting-dose`: The dose to begin with
- `minimum-dose-table`: The minimum dose for each target

## Outputs

- `weekly-dose-schedule`: The starting dose placed into specific days and times across the week
- `sustainability-check`: A check that the schedule survives a busy week, not just an ideal one

## Process

1. Place each dose into specific slots in the week rather than leaving it floating. Scheduled activity happens far more often than intended activity.
2. Spread the dose to match the target. Two strength sessions sit on separate days with recovery between, and cardio minutes can split across several short sessions.
3. Run the schedule against a realistic busy week. If it only fits when everything goes right, cut it to a version that fits a hard week.
4. Build in the smallest fallback version of each session, so a short day still lands a dose rather than a skip.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
