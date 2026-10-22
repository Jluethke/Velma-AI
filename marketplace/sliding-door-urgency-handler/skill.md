# Sliding Door Urgency Handler

For sliding door decisions, calculate the urgency. A sliding door that becomes one-way in 3 days needs immediate attention. One that slides closed in 6 months can wait. But every sliding door should have a 'decide by' date set well before the actual deadline.

## Inputs

- `classified-decisions`: Decisions classified by door type
- `sliding-door-deadlines`: When each sliding door closes

## Outputs

- `sliding-door-schedule`: For each sliding door: the 'decide by' date (set before the actual deadline) and the process to use (fast or deep depending on remaining time)
- `urgent-sliding-doors`: Sliding doors that close within 2 weeks, flagged for immediate attention

## Process

1. For each sliding door, set the 'decide by' date at 70% of the time remaining before it becomes one-way.
2. If the remaining time is short (less than 2 weeks), treat it as a one-way door now. You do not have time for a slow process.
3. If the remaining time is long (more than 2 months), schedule it but do not start the deep analysis yet. Gather information passively.
4. Flag any sliding door that you have been ignoring while it slides toward one-way.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
