# Scheduling Rules Definition

Define the rules that govern how availability translates into scheduled time.

## Inputs

- `individual-preferences`: Staff availability preferences
- `preference-conflicts`: Identified conflicts between preferences and needs

## Outputs

- `scheduling-rules`: Complete ruleset (min/max hours, consecutive limits, overtime triggers, fairness rotation)
- `coverage-requirements`: Minimum staffing levels by time slot and role

## Process

1. Set the minimum and maximum hours per person per week.
2. Define consecutive day limits (e.g., no more than 6 days in a row without a day off).
3. Set overtime thresholds and approval rules.
4. Define fairness rules (rotate weekends, distribute holidays, balance desirable and undesirable shifts).
5. Document the minimum coverage requirements by time slot and role.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
