# Inversion Find Exposure

Summarize where the plan is most exposed and which gaps deserve attention first.

## Inputs

- `plan-exposure`: Where the current plan does nothing to stop a failure path.
- `vulnerable-points`: The points where the plan actively moves toward failure.

## Outputs

- `exposure-summary`: Vulnerable points grouped by the part of the plan they sit in.
- `priority-gaps`: The gaps that would sink the effort if left open.

## Process

1. Group the vulnerable points by the part of the plan they sit in.
2. Rate each gap by how directly it leads to failure.
3. Name the priority gaps that would sink the effort if left open.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
