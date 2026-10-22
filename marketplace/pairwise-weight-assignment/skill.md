# Pairwise Weight Assignment

Weight the criteria using pairwise comparison. For every pair of criteria, ask: 'If I could only optimize for one of these, which would I choose?' The winner gets a point. After all pairs are compared, the points become the weights. This method is more reliable than asking 'how important is each criterion on a 1-to-10 scale' because pairwise comparison forces trade-off thinking.

## Inputs

- `evaluation-criteria`: The criteria to weight

## Outputs

- `weighted-criteria`: Each criterion with its weight derived from pairwise comparison
- `weight-rationale`: For each pairwise comparison: which criterion won and why

## Process

1. List all pairs of criteria. For N criteria, there are N*(N-1)/2 pairs.
2. For each pair, ask: if I could only optimize for one, which matters more for this decision? Record the winner.
3. Count the wins for each criterion. Normalize to percentages (wins / total comparisons).
4. Review the resulting weights. If the result surprises you, that is useful information about what you actually value versus what you said you value.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
