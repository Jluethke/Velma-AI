# Task Inventory Builder

Build a complete inventory of tasks and processes, with the time each one consumes. You cannot optimize what you have not measured.

## Inputs

- `scope-description`: What area of work to inventory (a role, a team, a department, your personal workload)
- `time-period`: Period to measure (one week is the minimum useful window)

## Outputs

- `task-inventory`: List of every task with frequency, average duration, and who performs it
- `total-hours-consumed`: Sum of hours spent across all tasks in the measurement period

## Process

1. Track every task performed during the time period. Use time logs, not memory. Memory underestimates small frequent tasks by 30-50%.
2. For each task, record: name, frequency (daily, weekly, monthly, ad-hoc), average duration, and who does it.
3. Sum the hours. If they exceed available hours, the system is already over capacity and something is being dropped or degraded.
4. Sort by total time consumed (frequency times duration). The top 20% of tasks consume roughly 80% of the time.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
