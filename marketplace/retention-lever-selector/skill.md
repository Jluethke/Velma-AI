# Retention Lever Selector

For each top driver, select the lever that addresses it and check feasibility. A manager driver is fixed by coaching or reassignment, a growth-ceiling driver needs a new career path, a compensation driver needs a budget decision.

## Inputs

- `ranked-drivers`: The drivers ranked by cost
- `cost-of-inaction`: The annual cost of each driver

## Outputs

- `selected-levers`: The top three levers chosen, each matched to the driver it moves
- `feasibility-notes`: For each lever, its cost, timeline, and probability of working

## Process

1. Match each top driver to a specific lever that would actually move it, not a generic morale initiative.
2. Estimate each lever's cost, timeline, and probability of working.
3. Rank levers by expected return: cost of inaction times probability of success, minus the lever's cost.
4. Keep the top three levers; trying to pull every lever at once dilutes all of them.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
