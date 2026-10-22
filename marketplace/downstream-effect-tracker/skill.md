# Downstream Effect Tracker

Track downstream effects of each change.

## Inputs

- `change-record-schema`: How changes are recorded
- `change-domains`: Types of changes tracked

## Outputs

- `effect-tracking-method`: How downstream effects are identified and recorded
- `linkage-rules`: Rules for linking changes to incidents or improvements

## Process

1. Define what counts as a downstream effect (incident, performance change, user complaint, improvement).
2. Set the observation window per change type (24 hours, 1 week, 1 month).
3. Create the linkage rules (how to associate an effect with its cause).
4. Document the tracking method.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
