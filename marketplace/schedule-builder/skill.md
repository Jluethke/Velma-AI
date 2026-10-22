# Schedule Builder

Build the team schedule with shift assignments and coverage.

## Inputs

- `staffing-requirements`: Required agents per shift
- `coverage-gaps`: Gaps to address

## Outputs

- `team-schedule`: Published schedule with shift assignments
- `on-call-roster`: On-call coverage assignments

## Process

1. Assign agents to shifts based on availability and skill.
2. Build the on-call roster for after-hours and overflow.
3. Handle shift swap requests.
4. Publish the schedule.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
