# Obstacle Removal Tracker

Capture the obstacles the report raises and track the manager's actions to remove them. The manager's main job in the meeting is to clear the path, and an untracked obstacle signals that raising them is pointless.

## Inputs

- `time-block-structure`: The three-block structure
- `block-guidance`: What belongs in each block

## Outputs

- `obstacle-list`: Each obstacle the report raises, carried forward until removed
- `manager-action-items`: The actions only the manager can take to clear each obstacle, with owners and dates

## Process

1. During the blockers block, write down each obstacle the report raises.
2. For each, decide who can remove it and by when, with the manager taking the items only the manager can act on.
3. Carry open obstacles forward to the next meeting rather than letting them disappear.
4. Close the loop visibly: when an obstacle is removed, note it so the report sees that raising it worked.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
