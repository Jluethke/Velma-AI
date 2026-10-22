# Volunteer Schedule Generator

Generate the volunteer schedule balancing coverage, fairness, and preferences.

## Inputs

- `availability-matrix`: Volunteer availability and preferences
- `skill-roster`: Qualified volunteers per role

## Outputs

- `draft-schedule`: The proposed schedule with volunteer assignments by date and role
- `coverage-gaps`: Dates or roles that remain unfilled after scheduling

## Process

1. Assign volunteers to roles and dates, distributing shifts fairly across the roster.
2. Respect preferences: honor blackout dates, preferred roles, and maximum frequency.
3. Identify remaining coverage gaps and flag them for recruitment or reassignment.
4. Produce the draft schedule for review before distribution.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
