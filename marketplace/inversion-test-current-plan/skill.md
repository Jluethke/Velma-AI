# Inversion Test Current Plan

Hold the current plan against each failure path and mark where the plan already invites that failure.

## Inputs

- `failure-paths`: Every action or condition that would move toward failure.
- `failure-ranked`: The failure paths ordered by how easily each could happen.

## Outputs

- `plan-exposure`: Where the current plan does nothing to stop a failure path.
- `vulnerable-points`: The points where the plan actively moves toward failure.

## Process

1. Walk the current plan step by step against each ranked failure path.
2. Mark every place where the plan does nothing to stop a failure path.
3. Record the points where the plan actively moves toward a failure path.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
