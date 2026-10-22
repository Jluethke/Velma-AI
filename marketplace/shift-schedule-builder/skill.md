# Shift Schedule Builder

Build the staff schedule ensuring ratio compliance across all time blocks.

## Inputs

- `availability-matrix`: Staff availability by day and time
- `staffing-minimums`: Required staff by classroom and time block
- `time-off-requests`: Approved time-off

## Outputs

- `published-schedule`: Final staff schedule by day, shift, and classroom assignment
- `substitute-needs`: Shifts requiring substitute coverage that could not be filled from regular staff

## Process

1. Assign staff to shifts starting with the hardest-to-fill time blocks (early open, late close).
2. Ensure every time block meets or exceeds the ratio minimum for each classroom.
3. Balance hours across staff according to their contracted hours and preferences.
4. Identify any remaining gaps that need substitute teachers.
5. Publish the schedule and notify all staff of their assignments.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
