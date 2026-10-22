# Participant Seeding Engine

Seed participants into the bracket based on rankings, ratings, or prior results.

## Inputs

- `tournament-format`: The selected format
- `format-rules`: Seeding and bye rules

## Outputs

- `seeded-bracket`: Initial bracket with participants placed by seed
- `seeding-rationale`: Explanation of how seeds were determined

## Process

1. Collect ranking or rating data for each participant.
2. Apply the seeding algorithm (highest seeds placed to meet latest).
3. Assign byes to top seeds if the field is not a power of two.
4. Produce the seeded bracket.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
