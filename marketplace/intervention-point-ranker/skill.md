# Intervention Point Ranker

Rank intervention points by leverage: how many downstream problems does each one prevent, and what does the intervention cost? The best intervention is the cheapest change at the most upstream point.

## Inputs

- `causal-chain`: The mapped causal chain from root to surface
- `intervention-candidates`: Nodes where intervention is feasible

## Outputs

- `ranked-interventions`: Intervention points ranked by leverage (problems prevented per dollar spent)
- `selected-intervention`: The chosen intervention point with rationale

## Process

1. For each candidate, count how many distinct downstream symptoms it would prevent if the chain broke at that point.
2. Estimate the cost of the intervention (one-time change cost, ongoing maintenance cost).
3. Calculate the ratio: annual cost of prevented problems divided by intervention cost. This is the leverage ratio.
4. Select the intervention with the highest leverage. If two are close, prefer the more upstream one.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
