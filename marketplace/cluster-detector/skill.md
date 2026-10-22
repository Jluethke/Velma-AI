# Cluster Detector

Look for clusters in the coded data. A cluster is 3 or more departures sharing a common attribute (same manager, same tenure band, same team, same stated reason). Clusters are the signal. Individual departures are noise. Sort the data by each attribute and count.

## Inputs

- `coded-exit-data`: The structured exit records
- `data-quality-notes`: Known gaps and biases in the data

## Outputs

- `cluster-report`: All clusters of 3+ departures sharing a common attribute, ranked by size
- `base-rate-comparison`: For each cluster, the departure rate compared to the company base rate, to distinguish real clusters from random variation

## Process

1. Group departures by manager. Calculate the departure rate per manager (departures / team size). Compare against the company-wide rate. Any manager above 1.5x the base rate is a cluster.
2. Group departures by tenure band (0-6 months, 6-12, 12-18, 18-24, 24-36, 36+). Look for a spike. A spike at 12-18 months is a growth ceiling. A spike at 0-6 months is a hiring or onboarding problem.
3. Group by team, role, and stated reason category. Apply the same 1.5x base rate threshold.
4. Rank the clusters by size and statistical significance. The largest cluster is the highest-leverage intervention point.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
