# Inversion Eliminate Modes

Redesign the plan so each priority failure path is removed or made far less likely.

## Inputs

- `exposure-summary`: Vulnerable points grouped by the part of the plan they sit in.
- `priority-gaps`: The gaps that would sink the effort if left open.

## Outputs

- `plan-changes`: The changes that close each priority failure path.
- `removed-modes`: The failure modes the changes take off the table.

## Process

1. For each priority gap, write a change that closes the failure path.
2. Prefer changes that remove a failure path outright over ones that only reduce it.
3. Record which failure modes the changes remove.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
