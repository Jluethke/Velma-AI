# Prevention Action Design

For each top-ranked failure theme, design a specific prevention action that can be taken now.

## Inputs

- `ranked-risks`: Failure themes ranked by likelihood times impact
- `plan-snapshot`: The current project plan

## Outputs

- `prevention-actions`: For each top 3 failure theme: one specific action to take now that reduces either the likelihood or the impact
- `plan-modifications`: Changes to the project plan that incorporate the prevention actions

## Process

1. For each top failure theme, ask: can we reduce the likelihood (prevent it from happening) or reduce the impact (limit the damage if it does happen)?
2. Design one specific, actionable prevention step for each. 'Monitor the vendor more closely' is too vague. 'Schedule weekly deliverable checkpoints with the vendor, with a contractual penalty clause for misses' is specific.
3. Integrate the prevention actions into the project plan as real tasks with owners and deadlines. A prevention action that is not in the plan will not happen.
4. Identify early warning indicators for each risk theme. What would you see in the first 2 weeks that signals this failure mode is developing? These become your monitoring triggers.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
