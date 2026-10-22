# Delay Measurement

Measure the delay at each stage and the total loop time. The total is the real quantity that matters, because it sets how long a mistake can run before anyone can see it.

## Inputs

- `loop-map`: The action-to-learning path
- `loop-stages`: The ordered stages

## Outputs

- `stage-delays`: The time the signal waits at each stage
- `total-loop-time`: The full time from action to learning

## Process

1. Measure how long the signal waits at each stage, including time spent queued or batched.
2. Sum the stage delays into a total loop time from action to learning.
3. Separate working time from waiting time, since waiting is usually the larger share.
4. Record the stages where the signal waits longest.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
