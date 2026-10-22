# Constraint Migration Tracker

After elevating the bottleneck, the constraint moves to a different stage. Track where it goes and restart the cycle. The Theory of Constraints is not a one-time exercise; it is a continuous loop.

## Inputs

- `selected-elevation`: The elevation action that was implemented
- `stage-map`: The full process map

## Outputs

- `new-bottleneck-assessment`: Where the constraint moved after the elevation, with new throughput measurements
- `system-throughput-change`: The before-and-after system throughput, proving the elevation worked (or didn't)

## Process

1. After implementing the elevation, re-measure throughput at every stage using the same method as the initial measurement.
2. Identify the new bottleneck (lowest throughput stage). It will be a different stage unless the elevation was insufficient.
3. Compare system-level output before and after. If output increased, the elevation worked. If not, the wrong stage was elevated or the elevation was incomplete.
4. Document the cycle: what was the constraint, what was done, where did it move. This becomes the audit trail for continuous improvement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
