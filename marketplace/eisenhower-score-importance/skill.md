# Eisenhower Score Importance

Score each task's importance by whether it advances a top priority, not by whether someone asked for it.

## Inputs

- `top-priorities`: The three priorities that matter most for the period.
- `priority-rationale`: Why each one earns a top spot.

## Outputs

- `importance-scores`: Each task marked important only if it advances a priority.
- `importance-reasons`: Why each task is or is not important.

## Process

1. For each task, judge whether it advances one of the top three priorities.
2. Mark a task important only when it moves a priority forward.
3. Reject 'someone asked' as a reason to call a task important.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
