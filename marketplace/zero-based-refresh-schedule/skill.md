# Zero Based Refresh Schedule

Set the refresh schedule: when to repeat the zero-based analysis and how to prevent bloat from re-accumulating.

## Inputs

- `reallocation-actions`: The actions being taken
- `total-bloat`: The total bloat identified

## Outputs

- `refresh-calendar`: When to repeat the full zero-based analysis (quarterly recommended) and the monthly spot-check protocol
- `zero-based-allocation-report`: The complete report: allocatable income, justified allocations, actual gaps, diagnoses, reallocation plan, and refresh schedule

## Process

1. Set the full zero-based refresh for once per quarter. Every 3 months, repeat the entire analysis from scratch. Do not carry forward last quarter's justified amounts because circumstances change.
2. Set a monthly spot-check: compare actual spending to justified allocations. If any category exceeds its justified amount by more than 20% for 2 consecutive months, investigate immediately instead of waiting for the quarterly refresh.
3. Define the bloat prevention rule: any new recurring commitment (subscription, service, membership) must have a justified allocation before it starts. If there is no room in the budget, something else must be cut first.
4. Produce the final report with all sections: income baseline, justified allocations with reasoning, actual gaps, bloat diagnoses, reallocation actions, freed capital destination, and the refresh schedule.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
