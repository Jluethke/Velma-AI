# Retention Tuner

Review the log, reset lapsed items, and tune the intervals for better retention.

## Inputs

- `review-log`: A record of recall results over time
- `lapse-list`: Items that failed and need extra attention

## Outputs

- `tuned-schedule`: An adjusted schedule based on your recall rate
- `retention-report`: A summary of retention and the changes made

## Process

1. Find items that lapse repeatedly and rewrite or split their prompts.
2. Adjust intervals that are too long or too short for your recall rate.
3. Retire items you no longer need to recall.
4. Summarize retention and the changes made.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
