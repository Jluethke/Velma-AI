# Upstream Rollout Plan

Sequence the chosen intervention with a verification checkpoint that measures the symptom rate after the change. Prevention is only proven when the downstream symptom count falls, not when the change is deployed.

## Inputs

- `feasible-interventions`: The interventions to roll out
- `feasibility-notes`: Control and cost notes

## Outputs

- `rollout-plan`: Ordered steps to put the intervention in place
- `verification-checkpoint`: When and how to confirm the symptom rate dropped

## Process

1. Order the chosen intervention into concrete steps with an owner for each.
2. Set a checkpoint date and tie it to the same symptom count captured at the start.
3. Define the threshold that counts as success and the fallback if the rate does not move.
4. Schedule a single re-measure so the fix is judged by outcome, not by completion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
