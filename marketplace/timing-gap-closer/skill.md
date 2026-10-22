# Timing Gap Closer

Close the timing gap. The handoff must happen at the right moment: not so early that the receiver is not ready, and not so late that the receiver is blocked.

## Inputs

- `handoff-map`: All handoffs
- `ownership-protocol`: When ownership transfers

## Outputs

- `timing-triggers`: For each handoff, the specific condition or event that triggers the handoff (not a calendar date unless calendar-driven)
- `readiness-criteria`: For each handoff, what must be true before the receiver can start (the work is complete, the information is packaged, the receiver has capacity)

## Process

1. For each handoff, define the trigger: a condition (item reaches a state), an event (approval granted), or a schedule (shift change at 6pm).
2. Define readiness criteria for both sides: the sender's work must be at a defined completion point, and the receiver must have capacity.
3. If the sender finishes but the receiver is not ready, park the item in a visible holding state with a due date for the receiver to pick it up.
4. If the receiver is ready but the sender is not done, make the delay visible. The receiver should not have to check repeatedly; the system should notify.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
