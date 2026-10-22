# Retention Intervention Tracker

Track whether the interventions actually reduced departures from the targeted clusters. Measure at 6 and 12 months. If the departure rate from a cluster drops by 30% or more after the intervention, the lever worked. If it does not, the hypothesis was wrong or the intervention was insufficient.

## Inputs

- `ranked-retention-levers`: The prioritized retention levers
- `intervention-plan`: The specific interventions being implemented

## Outputs

- `intervention-results`: For each intervention: the departure rate from the targeted cluster before and after, with a pass/fail judgment at the 30% reduction threshold
- `revised-hypotheses`: For interventions that failed, the revised hypothesis about the real cause and the next intervention to try

## Process

1. At 6 months post-intervention, count the departures from the targeted cluster. Compare against the same period before the intervention.
2. At 12 months, repeat. The 12-month number is the one that matters. Some interventions take time to show results.
3. If the departure rate dropped by 30% or more, the intervention worked. Document it for future reference.
4. If the departure rate did not change, the hypothesis was wrong or the intervention was too weak. Revisit the cluster data and generate a new hypothesis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
