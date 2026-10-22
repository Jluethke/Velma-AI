# Schedule Generation

Generate the shift schedule by assigning employees to shifts based on coverage needs, preferences, and rules.

## Inputs

- `employee-preferences`: Employee shift preferences and availability
- `preference-summary`: Summary of overstaffed and understaffed shifts

## Outputs

- `draft-schedule`: The draft schedule with employees assigned to shifts for the period
- `schedule-violations`: Any rule violations in the draft (overtime, consecutive days, fairness imbalances)

## Process

1. Start with the hardest-to-fill shifts (weekends, overnights, holidays) and assign based on availability and rotation fairness.
2. Fill remaining shifts by matching preferences to open slots.
3. Check for rule violations: overtime thresholds, consecutive day limits, required rest between shifts, fairness rotation.
4. Resolve violations by swapping assignments or flagging for manager decision.
5. Produce the draft schedule for review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
