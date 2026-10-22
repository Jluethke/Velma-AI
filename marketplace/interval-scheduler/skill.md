# Interval Scheduler

Assign an expanding review schedule such as one, three, seven, fourteen, thirty, and ninety days.

## Inputs

- `recall-prompts`: Questions that force recall of one fact each
- `answer-keys`: The single clear answer for each prompt

## Outputs

- `review-schedule`: The first review date for each prompt
- `interval-ladder`: The expanding ladder of review intervals

## Process

1. Set the expanding interval ladder for new items.
2. Assign each prompt a first review date.
3. Define how a correct answer moves an item up the ladder.
4. Define how an incorrect answer resets an item to a short interval.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
