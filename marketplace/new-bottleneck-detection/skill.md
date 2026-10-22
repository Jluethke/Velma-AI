# New Bottleneck Detection

After improving the bottleneck, detect where the new bottleneck has formed and restart the cycle.

## Inputs

- `elevation-options`: The investment made
- `step-sequence`: All steps in the system

## Outputs

- `new-system-throughput`: The system's throughput after the improvement
- `new-bottleneck`: The new constraint step, or confirmation that the system now meets the throughput goal

## Process

1. Re-measure the throughput capacity of every step, including the improved bottleneck.
2. The new bottleneck is the step that now has the lowest capacity. It may be the step that was second-slowest before, or it may be a step that was not previously close to being a constraint.
3. If the system now meets the throughput goal, stop. Do not optimize further. Over-optimization past the goal is waste.
4. If the system does not yet meet the goal, repeat the cycle: exploit the new bottleneck, subordinate other steps, and elevate if necessary. This is a continuous improvement loop, not a one-time event.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
