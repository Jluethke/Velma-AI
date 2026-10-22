# Decision Threshold Applier

Apply the decision threshold. Before starting the analysis, define what probability level triggers action. If the posterior exceeds the threshold, act. If not, either gather more evidence or decide against. The threshold should match the stakes: a 60% threshold for a cheap, reversible action; a 90% threshold for an expensive, irreversible one.

## Inputs

- `updated-probability`: The posterior probability after all evidence
- `hypothesis`: The original hypothesis

## Outputs

- `decision`: Whether the posterior exceeds the action threshold, and the resulting decision
- `remaining-uncertainty`: The gap between the posterior and certainty, and what it would take to close it

## Process

1. Define the action threshold based on the stakes of the decision.
2. Compare the posterior probability to the threshold.
3. If above: act on the hypothesis. Document the posterior and the evidence that got you there.
4. If below: decide whether more evidence is available and cost-effective. If not, act on the current best estimate or decline to act.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
