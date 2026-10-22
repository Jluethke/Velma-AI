# Bracket Round Manager

Manage each round of the bracket: record results, advance winners, handle withdrawals.

## Inputs

- `seeded-bracket`: The current bracket state
- `seeding-rationale`: Context for any re-seeding decisions

## Outputs

- `updated-bracket`: Bracket updated through all completed rounds
- `match-results-log`: Record of each match result and any incidents

## Process

1. For each round, confirm matchups and schedule times and venues.
2. Record results as matches complete and advance winners.
3. Handle withdrawals by advancing the opponent or replacing from the waitlist per the format rules.
4. Update the bracket after each round.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
