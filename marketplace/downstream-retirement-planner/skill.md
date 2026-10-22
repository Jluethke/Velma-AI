# Downstream Retirement Planner

After the upstream intervention is in place, identify and retire the downstream workarounds, firefighting processes, and exception handling that existed to deal with the problem. These are now waste.

## Inputs

- `intervention-design`: The upstream fix that was implemented
- `surface-point`: Where people were reacting to the problem

## Outputs

- `retired-workarounds`: List of downstream processes, checks, and workarounds that are no longer needed
- `freed-capacity`: Time and resources recovered by retiring the workarounds

## Process

1. List every downstream activity that existed only to handle the problem: rework steps, exception queues, escalation procedures, manual checks.
2. For each, confirm it is no longer needed by checking the leading indicator from the intervention.
3. Retire each workaround and calculate the time and cost recovered.
4. Add the freed capacity to the system's available resources. This is the hidden ROI of upstream intervention.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
