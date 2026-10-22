# Adaptive Execution Protocol

Execute within the constraints, adapting freely to circumstances as long as no constraint is violated.

## Inputs

- `action-space`: The available actions within constraints
- `resolved-constraints`: The boundaries

## Outputs

- `execution-protocol`: The operating rules: pursue opportunity freely, check constraints before major decisions, raise an alarm if a constraint is at risk
- `constraint-monitoring`: How to monitor each constraint for early signs of violation

## Process

1. The execution rule is simple: do whatever seems best, but check each major decision against the constraint list before committing. If the decision would violate a constraint, do not do it. Otherwise, proceed.
2. Set up lightweight monitoring for each constraint. A weekly 5-minute check: am I still within all boundaries? If any constraint is within 20% of being violated, take corrective action.
3. This approach handles uncertainty well. You do not need to predict the future or follow a rigid plan. You need only avoid the anti-goals, and everything within the boundaries is acceptable.
4. When circumstances change (a new opportunity, a crisis, a market shift), do not replan. Ask: does this change violate any constraint? If not, adapt freely. If it does, which constraint is at risk and can we protect it?

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
