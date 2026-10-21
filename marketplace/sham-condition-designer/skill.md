# Sham Condition Designer

Design sham, placebo, or vehicle conditions that match the experimental treatment in every way except the active ingredient.

## Inputs

- `experiment-description`: What the experiment is testing
- `confound-list`: Identified confounders

## Outputs

- `sham-condition-spec`: The sham or placebo condition with full procedure description
- `matching-checklist`: Checklist confirming the sham matches on all non-active dimensions

## Process

1. List every procedural step the subject experiences in the treatment condition.
2. For each step, determine whether it contains the active ingredient or is incidental.
3. Design a sham that replicates every incidental step but omits or replaces the active ingredient.
4. Verify the sham is indistinguishable to the subject and the operator (if double-blinded).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
