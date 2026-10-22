# Retention Analytics Review

Analyze retention patterns to identify problem cards (leeches) and adjust the system.

## Inputs

- `session-results`: Accumulated results from multiple sessions
- `updated-schedule`: Current schedule state

## Outputs

- `leech-cards`: Cards that have been reset 3 or more times (they are not sticking and need a different approach)
- `retention-rate`: Overall pass rate across all reviews, broken down by interval level

## Process

1. Identify leech cards: any card reset to interval 0 three or more times. These items are not sticking with simple repetition.
2. For leech cards, rewrite the card. Common fixes: make the prompt more specific, add a mnemonic or visual association, split a complex item into smaller items, or connect it to something you already know well.
3. Calculate retention rate by interval level. If retention drops below 85% at a specific interval (say the 14-day to 30-day jump), consider adding an intermediate interval (21 days).
4. Review monthly: if the daily load is too high, you may be adding new cards too fast. Limit new cards to 10-20 per day until the backlog clears.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
