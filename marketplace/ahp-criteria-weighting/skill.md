# Ahp Criteria Weighting

Define and weight decision criteria using the Analytic Hierarchy Process with consistency validation.

## Inputs

- `decision-context`: What is being decided, why, and who the decision makers are
- `candidate-criteria`: Initial list of evaluation criteria from stakeholders

## Outputs

- `weighted-criteria`: Criteria with AHP-derived weights, consistency ratio, and stakeholder agreement status
- `criteria-hierarchy`: If criteria have sub-criteria, the full hierarchy with weights at each level

## Process

1. Screen candidate criteria: remove duplicates, merge overlapping criteria, ensure each criterion is independent (changing one does not mechanically change another). A good trade study uses 5-9 criteria; more than 9 overwhelms the pairwise comparison.
2. Build the pairwise comparison matrix. For each pair of criteria, the decision maker rates relative importance on the Saaty scale: 1 = equal, 3 = moderate, 5 = strong, 7 = very strong, 9 = extreme. The matrix is reciprocal: if A vs B = 5, then B vs A = 1/5.
3. Compute the priority vector (weights) by normalizing the eigenvector of the comparison matrix. Calculate the consistency ratio: CR = CI / RI where CI = (lambda_max - n) / (n - 1) and RI is the random index for matrix size n. CR must be < 0.10 or the comparisons are inconsistent and must be revised.
4. If multiple decision makers participate, aggregate their individual pairwise matrices using the geometric mean method (row-by-row geometric mean across participants). Recompute weights and consistency from the aggregated matrix.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
