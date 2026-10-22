# Action Completion Tracker

Track completion status and surface carry-over items.

## Inputs

- `action-items`: Actions with owners and deadlines
- `theme-tags`: Themes from the retro

## Outputs

- `completion-status`: Status of each action (done, in progress, overdue, dropped)
- `carry-over-list`: Actions not completed, carried to the next sprint

## Process

1. Check each action against its deadline.
2. Classify as done, in progress, overdue, or dropped.
3. Flag carry-over items (actions surviving more than one retro cycle).
4. Produce the completion status and carry-over list.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
