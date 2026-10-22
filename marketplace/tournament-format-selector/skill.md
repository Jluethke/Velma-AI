# Tournament Format Selector

Select the tournament format based on the number of participants, time constraints, and goals.

## Inputs

- `participant-count`: Number of teams or individuals entered
- `tournament-constraints`: Available time, venues, and format preferences

## Outputs

- `tournament-format`: Selected format (single elimination, double elimination, round robin, Swiss) with rationale
- `format-rules`: Rules specific to the selected format (byes, seeding, tiebreakers)

## Process

1. Evaluate the participant count against available time and venues.
2. Select the format that fits the constraints (single elimination for speed, round robin for fairness, Swiss for large fields).
3. Define the tiebreaker and bye rules for the selected format.
4. Document the format and rules.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
