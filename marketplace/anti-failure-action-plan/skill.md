# Anti Failure Action Plan

For each overlap, design the opposite action: the specific behavior change that moves away from failure.

## Inputs

- `overlap-list`: Things you are doing that partially guarantee failure
- `severity-ranking`: Ranked by severity

## Outputs

- `anti-failure-actions`: For each overlap: the specific opposite behavior to adopt, who owns it, and the deadline
- `success-indicators`: How to measure whether each anti-failure action is working

## Process

1. For each overlap, define the exact opposite behavior. If the failure method is 'respond to support tickets in 4+ days,' the anti-failure action is 'respond to every ticket within 4 hours.'
2. Make each action specific and owned. 'Improve support response time' is not an action. 'Hire one additional support agent by March 1 to bring average response time below 4 hours' is an action.
3. Prioritize by severity: fix the high-severity overlaps first. These are the items where you are most actively driving toward failure.
4. Define a success indicator for each action. The indicator should show whether you are moving away from the failure mode, not just whether you implemented the action.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
