# Rotation Schedule Design

Design the on-call rotation schedule for the team.

## Inputs

- `team-roster`: List of team members available for on-call
- `service-coverage-requirements`: Hours and services that require on-call coverage

## Outputs

- `rotation-schedule`: On-call rotation schedule (weekly, daily, or follow-the-sun)
- `coverage-gaps`: Any gaps in coverage and how they are handled

## Process

1. Determine the rotation cadence (weekly is standard; daily for high-volume; follow-the-sun for global teams).
2. Assign team members to rotation slots, balancing weekday and weekend shifts.
3. Identify coverage gaps (holidays, vacations, single points of failure) and assign backups.
4. Publish the schedule to the paging system and team calendar.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
