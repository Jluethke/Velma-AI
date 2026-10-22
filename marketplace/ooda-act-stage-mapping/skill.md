# Ooda Act Stage Mapping

Map the Act stage: how a decision becomes a real action the opponent can observe. A fast decision that executes slowly still hands the opponent time to react.

## Inputs

- `loop-context`: The situation framed as a repeating decision loop
- `decide-map`: How decisions get made and who must approve them

## Outputs

- `act-map`: How decisions turn into executed actions
- `act-latency`: The time from a decision to action in the world

## Process

1. Trace how a decision becomes action: handoffs, build time, deployment, communication.
2. Measure the delay from decision to the action being real and visible.
3. Flag handoffs where a decision waits in a queue before anyone acts.
4. Record the act latency as a number.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
