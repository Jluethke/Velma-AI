# Inversion Confirm Avoidance

Check the revised plan against the original failure list and record the risks that still remain.

## Inputs

- `plan-changes`: The changes that close each priority failure path.
- `removed-modes`: The failure modes the changes take off the table.

## Outputs

- `revised-plan`: The plan after the failure paths are closed.
- `residual-risks`: The risks the plan accepts on purpose.

## Process

1. Re-run the full failure list against the revised plan.
2. Confirm each priority failure path is now blocked or far less likely.
3. List the residual risks that the plan accepts on purpose.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
