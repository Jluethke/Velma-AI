# Fragility Reducer

Identify and eliminate single points of failure that make you fragile to shocks.

## Inputs

- `single-points-of-failure`: The list of dependencies with no backup
- `shock-exposure-map`: The shock exposure assessment

## Outputs

- `fragility-fixes`: For each single point of failure: the redundancy to build, the cost, and the timeline
- `irreducible-fragilities`: Fragilities that cannot be eliminated (e.g., your own health), with the compensating controls

## Process

1. For each single point of failure, define the redundancy: a second income source, a backup system, a cross-trained person, a secondary supplier, an alternate workspace.
2. Estimate the cost of the redundancy. Compare to the cost of the shock: if the redundancy costs less than 10% of the shock's annual expected loss, build it.
3. For fragilities that cannot be eliminated (your own health, a regulatory change), define the compensating controls: insurance, contingency plans, documented procedures that someone else can follow.
4. Prioritize by shock severity: fix the fragility that leads to the most damaging shock first.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
