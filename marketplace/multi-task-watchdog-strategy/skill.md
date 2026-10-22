# Multi Task Watchdog Strategy

Design a watchdog feeding strategy that monitors all RTOS tasks, detecting any single stuck task even when others are healthy.

## Inputs

- `watchdog-config`: Watchdog type and timeout
- `system-timing`: Task list with expected cycle times

## Outputs

- `task-monitoring-design`: Check-in mechanism for each task, supervisor task logic, and the conditions that constitute a failure for each task
- `watchdog-feed-flow`: The exact code path from task check-ins through supervisor validation to watchdog feed, with no path that feeds the watchdog without verifying all tasks

## Process

1. Never feed the watchdog from a single point (like a timer ISR) because it will feed even when application tasks are stuck. Instead, implement a supervisor pattern: each task checks in by setting a flag or incrementing a counter, and a supervisor task verifies all tasks have checked in before feeding the watchdog.
2. Each task has a check-in deadline: the maximum time between consecutive check-ins. For periodic tasks, the deadline equals the period plus margin. For event-driven tasks, the deadline is the maximum expected idle time (or the task periodically checks in even when idle).
3. The supervisor task runs at the fastest task rate or on a timer. It reads each task's check-in counter, compares to the previous value, and resets the watchdog only if ALL tasks have checked in since the last supervisor cycle. If any task misses its deadline, the supervisor stops feeding the watchdog.
4. For tasks with variable execution time (e.g., a communication task that blocks on a receive), use a heartbeat within the blocking wait: the RTOS timeout on the blocking call should be shorter than the watchdog deadline, and the task sends a heartbeat (check-in) on each timeout, then retries the blocking call.
5. Handle task creation and deletion: when a task is created, register it with the supervisor (add to the monitored list). When a task is intentionally deleted, unregister it. The supervisor must not wait for check-ins from tasks that no longer exist.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
