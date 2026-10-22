# Equipment Distribution Manager

Handle uniform and equipment distribution and end-of-season return.

## Inputs

- `practice-schedule`: When teams start so equipment is distributed in time
- `game-schedule`: Season timeline for return scheduling

## Outputs

- `equipment-ledger`: Record of items distributed to each participant
- `return-status`: Items returned, missing, or damaged at season end

## Process

1. Inventory available uniforms and equipment by size.
2. Distribute uniforms and equipment at team formation, recording each item by participant.
3. Schedule and run equipment return at season end.
4. Reconcile the inventory against distributions and produce the equipment ledger.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
