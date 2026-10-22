# Retro Action Capturer

Capture action items from retrospectives with owners and deadlines.

## Inputs

- `retro-notes`: Notes from the retrospective session
- `team-roster`: Team members available to own actions

## Outputs

- `action-items`: List of actions with owner, deadline, and category
- `theme-tags`: Themes identified in the retrospective

## Process

1. Extract every action item from the retro notes.
2. Assign an owner and deadline to each.
3. Tag each action by theme (process, tooling, communication, workload, quality).
4. Produce the action list and theme tags.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
