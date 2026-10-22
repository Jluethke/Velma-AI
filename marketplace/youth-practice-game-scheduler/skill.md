# Youth Practice Game Scheduler

Schedule practices and games for all youth divisions.

## Inputs

- `approved-coaches`: Available coaches and their schedule constraints
- `coaching-assignments`: Coach-to-team mappings

## Outputs

- `practice-schedule`: Practice times and locations for each team
- `game-schedule`: Game schedule with dates, times, matchups, and venues

## Process

1. Collect coach and facility availability.
2. Schedule practices with one or two sessions per week per team.
3. Generate the game schedule balancing home and away, early and late time slots.
4. Distribute schedules to coaches and families.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
