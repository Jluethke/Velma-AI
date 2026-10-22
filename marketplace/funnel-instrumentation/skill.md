# Funnel Instrumentation

Instrument each step so you can see where the sequence of yeses stops and act on it.

## Inputs

- `sequenced-offers`: The ordered offers
- `friction-fixes`: Friction removed at each transition

## Outputs

- `funnel-metrics`: The conversion metric for each rung of the ladder
- `review-cadence`: How often to review the funnel and who owns the fix

## Process

1. Define the conversion metric for each transition, so every rung reports its own yes rate.
2. Set a baseline from current data where it exists, and mark where you are starting blind.
3. Decide how often to review the metrics and who acts when a rung underperforms.
4. Name the first experiment to run on the weakest rung at the next review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
