# Constraint Evolution Review

Review and evolve the constraint set periodically: some constraints become irrelevant, and new ones become necessary.

## Inputs

- `execution-protocol`: How execution has been going
- `resolved-constraints`: The current constraints

## Outputs

- `constraint-review`: Each constraint assessed: still relevant, needs tightening, needs loosening, or should be retired
- `new-constraints`: New anti-goals that have emerged from experience during the execution period

## Process

1. Review each constraint: was it ever at risk of being violated? If it was never even close, it might be too loose (could be tightened) or irrelevant (could be retired).
2. If a constraint was violated, what happened? Was the consequence as bad as expected? If worse, tighten the constraint. If milder, the constraint was correctly set.
3. Add new constraints from recent experience. If something happened during execution that you wish you had prevented, it becomes a new anti-goal.
4. The constraint set should evolve over time. As you learn what really matters and what does not, the boundaries become more precise and the operating space becomes better defined.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
