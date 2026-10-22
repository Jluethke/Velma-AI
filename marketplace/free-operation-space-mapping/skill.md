# Free Operation Space Mapping

Map the space of acceptable actions: everything that does not violate any constraint is allowed.

## Inputs

- `resolved-constraints`: The final set of anti-goals
- `planning-context`: The planning situation

## Outputs

- `action-space`: The set of strategies, tactics, and approaches that are available within the constraints
- `surprising-options`: Actions that are allowed by the constraints that you would not have considered under a traditional goal-based plan

## Process

1. Instead of asking 'what should I do?' ask 'what CAN I do within these boundaries?' The answer is usually a much larger space than a goal-based plan would suggest.
2. List the strategies and approaches that satisfy all constraints. Some will be obvious. Others will be surprising because traditional goal-based thinking would not have considered them.
3. The value of constraint-based planning is flexibility. Any path within the constraints leads to an acceptable outcome. This means you can adapt to changing circumstances without replanning.
4. Identify the options that are uniquely enabled by the constraint approach: paths that a goal-based plan would have excluded because they do not aim directly at the goal, but that avoid all the anti-goals.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
