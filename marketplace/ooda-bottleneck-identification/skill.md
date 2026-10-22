# Ooda Bottleneck Identification

Add the four stage latencies into total cycle time and find the slowest stage. The bottleneck is the single stage that costs the most time, and it is the only stage worth attacking first.

## Inputs

- `observe-latency`: The time from an event to you knowing about it
- `orient-latency`: The time from seeing information to understanding it
- `decide-latency`: The time from understanding to a committed choice
- `act-latency`: The time from a decision to action in the world

## Outputs

- `loop-bottleneck`: The slowest stage and its share of total cycle time
- `cycle-time-total`: The full loop time from event to action

## Process

1. Add the four latencies to get the total cycle time.
2. Rank the stages by how much time each one costs.
3. Name the slowest stage as the bottleneck and give its share of the total.
4. Compare total cycle time to the competitor tempo. Slower than the rival means you react to old moves.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
