# Retention Outcome Tracker

Track whether each intervention actually reduced departures from its targeted cluster. A drop of 30 percent or more at twelve months means the lever worked; no change means the hypothesis was wrong or the intervention was too weak.

## Inputs

- `intervention-plan`: The interventions being run
- `success-metrics`: The targets and baseline

## Outputs

- `outcome-report`: For each intervention, the before and after departure rate with a pass or fail at the 30 percent threshold
- `revised-driver-hypotheses`: For interventions that failed, the revised driver hypothesis and the next lever to try

## Process

1. At six months, count departures from each targeted cluster against the baseline window.
2. At twelve months, repeat; the twelve-month number is the one that decides.
3. A drop of 30 percent or more means the lever worked, so document it for reuse.
4. No change means the real driver was something else, so revise the hypothesis and pick the next lever.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
