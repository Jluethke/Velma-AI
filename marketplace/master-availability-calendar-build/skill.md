# Master Availability Calendar Build

Build the master availability calendar that combines all individual schedules and rules.

## Inputs

- `scheduling-rules`: The scheduling ruleset
- `coverage-requirements`: Minimum staffing levels by time slot

## Outputs

- `master-calendar`: The consolidated availability calendar showing who is available when
- `coverage-gaps`: Time slots where coverage falls below the minimum requirement

## Process

1. Overlay all individual availability onto a single calendar view.
2. Apply the scheduling rules to filter out violations (overtime, consecutive day limits).
3. Identify coverage gaps where available staff falls below the minimum requirement.
4. Propose solutions for gaps (shift trades, on-call assignments, temporary staff).
5. Publish the master calendar to the scheduling system.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
