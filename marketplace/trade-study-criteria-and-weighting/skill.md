# Trade Study Criteria And Weighting

Define evaluation criteria and assign weights using the Analytic Hierarchy Process or swing weight method to make value judgments explicit and traceable.

## Inputs

- `candidate-list`: Screened candidate solutions
- `pugh-matrix-results`: Quick screening results

## Outputs

- `evaluation-criteria`: Complete list of criteria (performance, cost, schedule, risk, manufacturability, maintainability, growth potential) with definitions precise enough that two evaluators would assess the same candidate the same way
- `criteria-weights`: Normalized weights (summing to 1.0) derived from AHP pairwise comparison or swing weight method, with consistency check
- `scoring-scales`: For each criterion, a 1 to 5 or 1 to 10 scale with anchored descriptions at each level (not just 'good' to 'bad,' but specific technical thresholds)

## Process

1. Define criteria from the requirements and stakeholder priorities. Typical categories: technical performance, cost (development + production + lifecycle), schedule risk, manufacturing complexity, reliability/maintainability, and growth potential. Each criterion must be independent (no double-counting: if reliability is a criterion, do not also have 'quality' as a separate criterion covering the same ground).
2. Assign weights using the Analytic Hierarchy Process: compare every pair of criteria and rate which is more important on a 1-9 scale (1 = equally important, 3 = moderately more important, 5 = strongly more important, 9 = extremely more important). Construct the pairwise comparison matrix, compute the principal eigenvector for weights, and check consistency (CI/RI < 0.10).
3. Alternative: use swing weight method. Imagine the worst score on every criterion. Now imagine improving one criterion from worst to best. Which improvement matters most? That criterion gets the highest weight. Continue ranking improvements to derive weights. This is faster than AHP and avoids the consistency problem.
4. Define anchored scoring scales. For a cost criterion: 1 = over $500, 2 = $300-$500, 3 = $150-$300, 4 = $75-$150, 5 = under $75. For a reliability criterion: 1 = MTBF below 5,000 hours, 3 = 10,000-20,000, 5 = above 50,000. Anchoring prevents score compression where everything gets a 3 or 4.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
