# Rtos Priority Assignment

Assign task priorities using rate monotonic analysis or deadline monotonic scheduling, then verify with utilization bound and exact response time tests.

## Inputs

- `task-list`: Tasks with periods and WCETs
- `isr-list`: Interrupts with WCETs and frequencies

## Outputs

- `priority-table`: Each task with assigned priority level, period, WCET, and utilization
- `schedulability-result`: Pass/fail with utilization sum, utilization bound, and per-task response times vs deadlines

## Process

1. Calculate utilization for each task: U_i = C_i / T_i where C_i is WCET and T_i is period. Sum all utilizations to get total U.
2. For rate monotonic scheduling (RMS), assign higher priority to shorter-period tasks. For deadline monotonic (DMS), assign higher priority to shorter-deadline tasks. RMS is optimal for implicit deadlines (D = T). DMS is optimal when deadlines differ from periods.
3. Check the Liu and Layland utilization bound: U_bound = n * (2^(1/n) - 1) for n tasks. If total U is less than or equal to U_bound, the task set is schedulable under RMS. This is a sufficient but not necessary condition.
4. For task sets that exceed the utilization bound but have U less than 1.0, perform exact response time analysis. For each task i: R_i = C_i + sum over higher priority j of ceiling(R_i / T_j) * C_j. Iterate until R_i converges. If R_i is less than or equal to D_i for all tasks, the system is schedulable.
5. Account for ISR overhead in the response time analysis by treating interrupt processing time as the highest-priority 'task' that preempts everything.
6. If schedulability fails, options in order of preference: reduce WCET through code optimization, increase the processor clock, move to a faster MCU, or relax the deadline requirements with the system architect.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
