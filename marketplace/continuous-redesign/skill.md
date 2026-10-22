# Continuous Redesign

Redesign the loop to replace periodic steps with continuous ones and to shrink batches. The largest wins come from turning scheduled reviews into live signals, so the result is seen as it happens rather than at the next meeting.

## Inputs

- `delay-sources`: Delays tagged by source
- `biggest-delay`: The heaviest single delay

## Outputs

- `redesigned-loop`: The loop with periodic steps made continuous and batches shrunk
- `batching-removed`: Which batches and scheduled waits were eliminated

## Process

1. Replace the biggest periodic wait with a continuous signal that updates as results arrive.
2. Shrink batches toward single-item flow wherever the economics allow.
3. Collapse queued reviews into the work itself so the signal does not wait for a free reviewer.
4. Recompute the projected loop time after the redesign.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
