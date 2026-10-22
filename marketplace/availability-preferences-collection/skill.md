# Availability Preferences Collection

Collect individual availability preferences from staff or resource owners.

## Inputs

- `team-roster`: List of staff or resources whose availability needs to be managed
- `scheduling-period`: The time period being scheduled (week, month, quarter)

## Outputs

- `individual-preferences`: Each person's preferred hours, days off, constraints, and hard limits
- `preference-conflicts`: Conflicts between individual preferences and business needs

## Process

1. Send each team member an availability form covering the scheduling period.
2. Collect preferred working hours, preferred days off, hard constraints (school pickup, second job, medical), and overtime willingness.
3. Identify conflicts between individual preferences and the coverage requirements.
4. Flag any unresolvable conflicts for manager review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
