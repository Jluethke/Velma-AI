# Review Session Runner

Run the daily sessions, scoring recall and updating each item's next interval.

## Inputs

- `daily-session-plan`: A plan for the short daily review
- `due-queue-rules`: Rules for building each day's queue

## Outputs

- `review-log`: A record of recall results over time
- `lapse-list`: Items that failed and need extra attention

## Process

1. Answer each due prompt from memory before checking the key.
2. Score each answer and move the item along or back on the ladder.
3. Add failed items to the lapse list for extra attention.
4. Stop when the time box ends and carry any overflow to tomorrow.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
