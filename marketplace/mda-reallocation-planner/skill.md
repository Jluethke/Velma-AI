# Mda Reallocation Planner

Move dollars from low-priority lines to high-priority lines.

## Inputs

- `reallocation-candidates`: Lines to fund and lines to trim
- `high-add-lines`: Lines where added money helps most

## Outputs

- `reallocation-plan`: Sized moves of dollars from trims to additions
- `net-change-summary`: Net change per category after the moves

## Process

1. Match dollars freed from low-pain cuts against high-value additions.
2. Size each move so the total stays within the baseline.
3. Summarize the net change per category.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
