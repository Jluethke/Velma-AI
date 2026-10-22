# Retention Lever Ranker

Rank the retention levers by impact and feasibility. The largest cluster with a fixable cause is the highest-priority intervention. A cluster caused by a bad manager can be fixed by coaching or replacing the manager. A cluster caused by below-market compensation requires a budget decision. A cluster caused by a growth ceiling requires creating a new career path.

## Inputs

- `real-reason-hypotheses`: The hypothesized real causes for each cluster
- `validation-suggestions`: How to validate each hypothesis

## Outputs

- `ranked-retention-levers`: The retention levers ranked by expected impact (cluster size times probability of success) and feasibility (cost, timeline, organizational willingness)
- `intervention-plan`: For the top 3 levers, the specific intervention, expected timeline, and how to measure whether it worked

## Process

1. For each cluster, estimate the cost of doing nothing: the number of departures per year times the cost of replacement (typically 50-200% of annual salary depending on seniority).
2. For each intervention, estimate the cost and probability of success. A manager coaching program costs X and has Y% success rate. A 10% compensation adjustment costs Z.
3. Rank by: (cluster size x replacement cost x probability of success) minus intervention cost. This is the expected ROI of each lever.
4. For the top 3 levers, write the intervention plan: what specifically will change, by when, and how you will measure the result (departure rate from this cluster at 6 and 12 months).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
