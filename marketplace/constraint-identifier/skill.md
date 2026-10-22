# Constraint Identifier

Identify the bottleneck: the stage with the lowest throughput. This stage determines the output of the entire system. Everything downstream starves; everything upstream accumulates.

## Inputs

- `stage-throughput-data`: Measured throughput at each stage
- `queue-depth-data`: Queue depths between stages

## Outputs

- `bottleneck-stage`: The stage with the lowest throughput, confirmed by queue buildup upstream of it
- `constraint-throughput`: The measured throughput of the bottleneck stage, which equals the system's maximum output

## Process

1. Rank all stages by throughput from lowest to highest. The lowest is the candidate bottleneck.
2. Confirm by checking queue depth: the largest queue should be immediately upstream of the bottleneck.
3. If multiple stages have similar throughput, the one with the largest upstream queue is the binding constraint.
4. State clearly: the system cannot produce more than the bottleneck's throughput, regardless of improvements elsewhere.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
