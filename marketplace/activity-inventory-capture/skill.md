# Activity Inventory Capture

List every activity in the chosen area along with the time or resource it consumes. An honest inventory counts the small recurring activities that hide from attention, not just the visible big ones.

## Inputs

- `activity-domain`: The role, team, or process to audit
- `time-period`: The window over which activity is counted

## Outputs

- `activity-list`: Every activity performed in the area
- `time-allocation`: Time or resource each activity consumed over the window

## Process

1. List every distinct activity performed in the area over the window, including small recurring ones.
2. Attach the time or resource each activity consumed, measured rather than guessed where possible.
3. Split activities that bundle very different work so each line has a single purpose.
4. Confirm the time allocations roughly sum to the real capacity of the window.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
