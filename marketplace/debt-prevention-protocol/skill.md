# Debt Prevention Protocol

Prevent new organizational debt from accumulating. For every new process, meeting, approval chain, or role created going forward, require: the specific problem it solves, the sunset date (when it will be reviewed for elimination), and the success metric (how to know if it is working). Without these, the process is born as debt.

## Inputs

- `elimination-decisions`: What was eliminated or simplified
- `freed-capacity`: Hours and FTEs recovered

## Outputs

- `prevention-protocol`: The process for creating new processes: required fields (problem statement, sunset date, success metric) and the review cadence
- `debt-review-schedule`: The recurring schedule for auditing existing processes for debt, using the same method that produced this audit

## Process

1. Require every new process, meeting, or approval chain to have three fields at creation: (1) the specific problem it solves, (2) the sunset date (default: 6 months, after which it must be justified to continue), and (3) the success metric (how to know it is working).
2. At each sunset date, review the process against its success metric. If it is not meeting the metric, eliminate it.
3. Schedule a full organizational debt audit annually, using the same method: inventory, origin stories, cost calculation, elimination decisions.
4. Track the trend: is total organizational debt increasing or decreasing year over year? A healthy organization reduces debt over time.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
