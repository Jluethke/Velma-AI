# Single Point Of Failure Detector

Scan the matrix for single points of failure: skills where only one person is competent or above. If that person is out, the team cannot perform that function. Rank the single points by how often the skill is needed and what happens when it is unavailable.

## Inputs

- `coverage-matrix`: The skill coverage matrix
- `confidence-notes`: The confidence flags

## Outputs

- `single-point-list`: Every skill with exactly one person at competent or above
- `spof-impact-ranking`: The single points ranked by frequency of need times consequence of unavailability

## Process

1. For each skill, count the people at competent or above.
2. A count of one is a single point of failure, so record each one.
3. For each single point, estimate how often the skill is needed and what happens when the person is unavailable: work stops, quality drops, or a workaround exists.
4. Rank the single points by frequency times consequence; daily need and work stopping is the highest priority.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
