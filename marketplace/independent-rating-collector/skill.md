# Independent Rating Collector

Have each manager rate the same examples alone, before any discussion. Independent rating first exposes real disagreement; discussing before rating lets the loudest voice set the anchor.

## Inputs

- `example-set`: The anonymized examples
- `example-answer-key`: The private original ratings

## Outputs

- `independent-ratings`: Each manager's rating of every example, submitted before any discussion
- `rating-spread`: The spread per example, showing where managers agree and where they scatter

## Process

1. Give every manager the same anonymized example set and the rating scale.
2. Have each manager rate every example alone, with no discussion, and submit before the session.
3. Collect all ratings and compute the spread per example: where managers agree and where they scatter.
4. Keep the ratings attributed privately so you can see which managers run high or low, without exposing it in the room.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
