# Estimation Validation

Validate the estimates by summing the parts and comparing to the whole. If the sum of the tasks does not match a top-down estimate, investigate the gap.

## Inputs

- `task-list`: The task-level estimates
- `initiative-description`: The initiative for top-down estimation context

## Outputs

- `bottom-up-total`: The sum of all task estimates, organized by deliverable and total
- `top-down-estimate`: An independent top-down estimate based on comparable past initiatives or expert judgment
- `estimation-gap-analysis`: The difference between bottom-up and top-down estimates, with the likely causes of the gap

## Process

1. Sum the task estimates by deliverable and for the project total. This is the bottom-up estimate.
2. Independently estimate the total using a top-down method: how long did similar initiatives take? What does an experienced person estimate without seeing the task breakdown?
3. Compare the two. If the bottom-up is significantly lower than the top-down, the breakdown probably missed tasks (integration work, testing, documentation, coordination overhead). If higher, the breakdown may be too granular (sub-tasks inflated when viewed individually).
4. Investigate the gap: add the missing tasks, adjust the inflated ones, or reconcile the two estimates. The final estimate should be defensible from both directions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
