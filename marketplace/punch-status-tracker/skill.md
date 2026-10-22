# Punch Status Tracker

Track punch list item status and verify corrections.

## Inputs

- `assigned-punch-list`: Punch list with responsible parties and deadlines

## Outputs

- `status-report`: Current status of all punch list items
- `overdue-items`: Items past their completion deadline

## Process

1. Update item status as work is completed (open, in progress, complete, verified).
2. Re-inspect completed items to verify the correction.
3. Escalate overdue items to the project manager.
4. Track completion percentage and forecast the close-out date.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
