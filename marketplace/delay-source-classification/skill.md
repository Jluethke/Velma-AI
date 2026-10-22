# Delay Source Classification

Classify each delay by its source: batching, queued review, or periodic reporting. Naming the source points to the fix, because batching, queues, and schedules are each removed in a different way.

## Inputs

- `stage-delays`: Delay at each stage
- `total-loop-time`: Full loop time

## Outputs

- `delay-sources`: Each delay tagged batching, queue, or periodic reporting
- `biggest-delay`: The single stage contributing the most waiting

## Process

1. Tag a delay as batching when the signal waits for a group of items to accumulate.
2. Tag a delay as a queue when the signal waits for a person or step to become free.
3. Tag a delay as periodic reporting when the signal waits for a scheduled review.
4. Identify the single stage that contributes the most waiting to the total.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
