# Miss Logging Method

Set up a log that records misses and counts consecutive misses, so the second miss is impossible to ignore.

## Inputs

- `never-miss-twice-rule`: The never miss twice rule
- `miss-definition`: What counts as a miss

## Outputs

- `miss-log`: A simple record marking each day as completed, recovery, or miss
- `consecutive-miss-counter`: A running count of consecutive misses that resets on any completed or recovery day

## Process

1. Mark every day as completed, recovery, or miss. Three states, not two, so a recovery day is visibly different from a full day and from a miss.
2. Keep a consecutive-miss counter that increments on a miss and resets to zero on any completed or recovery day.
3. Place the log where you will see it daily, because the point is to catch the counter at one before it reaches two.
4. Review the misses for patterns over time. Misses that cluster on the same weekday or situation reveal a design problem to fix at the source.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
