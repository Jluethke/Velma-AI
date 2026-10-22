# Eisenhower Score Urgency

Score each task's urgency by whether a real consequence lands within 24 hours, not by whether someone wants it soon.

## Inputs

- `importance-scores`: Each task marked important only if it advances a priority.
- `importance-reasons`: Why each task is or is not important.

## Outputs

- `urgency-scores`: Each task marked urgent only if a consequence lands within 24 hours.
- `urgency-reasons`: Why each task is or is not urgent.

## Process

1. For each task, ask whether a real consequence hits within 24 hours.
2. Mark a task urgent only when the deadline is that close and that real.
3. Reject 'someone wants it soon' as a reason to call a task urgent.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
