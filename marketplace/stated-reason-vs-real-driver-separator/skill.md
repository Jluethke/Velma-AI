# Stated Reason Vs Real Driver Separator

Separate the stated reason from the real driver by cross-referencing survey results with departure patterns. When four people leave the same manager citing four different reasons, the real driver is usually the manager, not four separate things.

## Inputs

- `pulse-survey`: The survey instrument
- `anonymity-protocol`: The anonymity rules in force

## Outputs

- `stated-vs-driver-table`: For each cluster, the scattered stated reasons lined up against the consistent survey driver
- `driver-hypotheses`: A hypothesis for each cluster naming the real driver and the evidence for it

## Process

1. For each cluster, line up the stated reasons against the pulse survey results for that same team or tenure band.
2. Where stated reasons scatter but one survey driver is consistently low, treat that driver as the real cause.
3. Check whether the departures coincide with a change: a new manager, a reorg, a lost project, a policy shift.
4. Write a hypothesis for each cluster: the real driver is X, because the stated reasons scatter while the survey points to X.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
