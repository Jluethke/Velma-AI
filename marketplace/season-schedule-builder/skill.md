# Season Schedule Builder

Create the season schedule with matchups, dates, times, and venue assignments.

## Inputs

- `registered-teams`: Teams registered in each division
- `registration-ledger`: Confirmed registrations

## Outputs

- `season-schedule`: Complete schedule of games with dates, times, matchups, and venues
- `venue-assignments`: Venue and field allocation for each game

## Process

1. Determine the number of games per team based on the league format (round robin, partial round robin).
2. Generate matchups ensuring balanced home and away assignments.
3. Assign dates, times, and venues to each game avoiding conflicts.
4. Publish the season schedule.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
