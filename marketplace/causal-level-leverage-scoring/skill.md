# Causal Level Leverage Scoring

Score each level of the causal chain for prevention leverage: how many downstream symptoms it would stop and how durable the fix would be. Intervening near the top treats one instance; intervening near the root treats the class.

## Inputs

- `causal-chain`: Ordered chain of causes
- `root-cause-candidates`: The lowest in-control causes

## Outputs

- `leverage-scored-levels`: Each causal level with a prevention-leverage score
- `highest-leverage-level`: The level where one change prevents the most recurrence

## Process

1. For each level, estimate how many downstream occurrences a fix at that level would prevent.
2. Estimate how durable a fix would be at each level, favoring causes that do not drift back over time.
3. Score each level on reach times durability, so a narrow permanent fix can beat a broad temporary one.
4. Select the level with the highest score as the intervention target, which is usually several levels above the root and above the symptom.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
