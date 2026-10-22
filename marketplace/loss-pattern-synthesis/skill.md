# Loss Pattern Synthesis

Cluster the reason pairs into recurring loss patterns and name the single objection that shows up most.

## Inputs

- `reason-pairs`: Stated and real reasons per loss
- `reason-confidence`: Confidence ratings on real reasons
- `stage-distribution`: Where losses concentrate by stage

## Outputs

- `loss-patterns`: Named clusters of losses that share a real reason
- `dominant-objection`: The one objection responsible for the most lost revenue

## Process

1. Group the real reasons into clusters, weighting each by deal size and by reason confidence.
2. Cross the clusters against the stage distribution to see where each pattern tends to kill the deal.
3. Rank clusters by lost revenue, not by count, so one large recurring loss is not hidden by many small ones.
4. Name the top cluster as the dominant objection and write it in the buyer's language.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
