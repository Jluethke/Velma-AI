# Failure Cause Clustering

Cluster the raw failure causes into themes and rank them by likelihood and impact.

## Inputs

- `raw-failure-causes`: All failure causes from the imagination session
- `assumption-list`: The assumptions from the plan snapshot

## Outputs

- `failure-themes`: Failure causes grouped by theme (e.g., team capacity, technical risk, market shift, dependency failure)
- `ranked-risks`: Each theme ranked by: likelihood (how many people mentioned it) times impact (how badly it would hurt)

## Process

1. Group the raw causes into 5-8 themes. Similar causes cluster together: 'developer quit' and 'team burned out' are both team capacity risks.
2. Count the frequency of each theme. A theme mentioned by 4 of 6 participants is more likely than one mentioned by 1.
3. Rate each theme on impact: if this failure cause materialized, how badly would it damage the project? Use a 1-10 scale.
4. Rank themes by likelihood times impact. The top 3 are the pre-mortem's priority findings. These are the failure modes the team collectively believes are both probable and dangerous.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
