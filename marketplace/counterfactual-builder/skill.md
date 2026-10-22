# Counterfactual Builder

For the top patterns, construct the counterfactual: what would have changed the outcome? This turns the analysis into specific actions.

## Inputs

- `loss-patterns`: The recurring patterns explaining losses
- `pattern-stage-map`: Where each pattern strikes

## Outputs

- `counterfactual-actions`: For each pattern: the specific change to messaging, process, proof, or offering that would address it
- `implementation-priority`: Actions ranked by expected impact (losses prevented times value per loss)

## Process

1. For each pattern, pick the three most representative losses. Replay each from the failure point: what if you had said X instead of Y? Provided proof Z? Asked a different question?
2. Write the specific change: a new slide in the deck, a different opening question, a case study that addresses this objection, a pricing structure change, or a process simplification.
3. Estimate the impact: if this change prevents half the losses in this pattern, how much value does that recover?
4. Rank by recovered value divided by implementation effort. The highest-ratio changes go first.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
