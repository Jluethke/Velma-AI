# Rcm Implementation And Feedback

Implement the RCM-derived maintenance program and establish the feedback loop that updates maintenance tasks as field data accumulates, preventing the program from becoming static and obsolete.

## Inputs

- `maintenance-task-assignments`: Selected tasks for each failure mode
- `maintenance-schedule`: Consolidated schedule

## Outputs

- `maintenance-procedures`: Work instructions for each maintenance task including what to inspect, how to measure, acceptance criteria, and actions if criteria are not met
- `feedback-mechanism`: Data collection requirements and review trigger criteria that update maintenance intervals as field experience grows

## Process

1. Write maintenance procedures that technicians can follow without RCM expertise. Each procedure must state: what to do (specific measurements or inspections), how to do it (tools, instrument settings, access procedure), what constitutes a pass (quantified acceptance criteria, not 'appears satisfactory'), and what to do if it fails (repair, replace, schedule corrective action, or declare the unit unserviceable).
2. For condition-based tasks, define the measurement technology and trending methodology. Example: electrolytic capacitor ESR monitoring. Measure ESR with an LCR meter at 100 kHz on each scheduled maintenance. Plot the trend. Set alert threshold at 2x initial ESR. Set action threshold at 3x initial ESR. The slope of the trend predicts remaining life.
3. Establish the age exploration process. For every failure mode currently assigned to run-to-failure or condition-based monitoring, track the failure age (operating hours or calendar time at failure). After accumulating 5-10 failure data points, fit a Weibull distribution. If the shape parameter beta exceeds 1.5, the failure mode is wear-out and may benefit from scheduled replacement at the characteristic life (63% of the population has failed).
4. Define the review triggers that prompt a maintenance program update: a failure that the maintenance program should have prevented, three or more failures of the same mode within a review period, new information from the manufacturer (service bulletin, reliability update), or a change in operating context (increased duty cycle, new environment).
5. Calculate maintenance effectiveness metrics after 12 months of operation. Track: unplanned failure rate (should decrease), maintenance cost per operating hour (should decrease or remain stable), system availability (should increase). If unplanned failures are not decreasing, the maintenance tasks are not addressing the dominant failure modes and the RCM analysis needs revision.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
