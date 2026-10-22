# Oncall Schedule Designer

Define the on-call rotation schedule with primary and secondary responders, shift lengths, and coverage windows.

## Inputs

- `team-roster`: List of team members available for on-call duty
- `coverage-requirements`: Hours and days requiring on-call coverage

## Outputs

- `rotation-schedule`: The completed on-call rotation calendar
- `coverage-gaps`: Any identified gaps in coverage

## Process

1. List all team members and their availability constraints
2. Define shift length and rotation frequency
3. Assign primary and secondary responders for each slot
4. Identify and resolve any coverage gaps

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
