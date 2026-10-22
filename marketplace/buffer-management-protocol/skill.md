# Buffer Management Protocol

Manage the project by buffer consumption, not by individual task status. A task that is late is not a problem if the buffer absorbs it. A buffer that is more than two-thirds consumed is the alarm.

## Inputs

- `project-buffer`: The project buffer size and current consumption
- `feeding-buffers`: The feeding buffer sizes and current consumption

## Outputs

- `buffer-status-dashboard`: For each buffer: size, consumption (days used), percentage consumed, and zone (green: under 1/3, yellow: 1/3 to 2/3, red: over 2/3)
- `buffer-management-rules`: Green: no action. Yellow: investigate the cause, plan corrective action. Red: execute corrective action immediately.

## Process

1. Track buffer consumption weekly. Each time a critical chain task takes longer than its aggressive estimate, the overage is subtracted from the project buffer. Same for feeding buffers.
2. Zone the buffers: green (0-33% consumed, project is on track), yellow (34-66% consumed, investigate and plan), red (67-100% consumed, act now).
3. In the yellow zone: identify why the buffer is being consumed. Is it one task that exploded or a pattern of small overruns? Plan the corrective action but do not execute yet.
4. In the red zone: execute corrective action. Options: add resources to the critical chain task, de-scope non-essential features, crash the schedule by overlapping tasks that were sequential, or extend the project finish date.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
