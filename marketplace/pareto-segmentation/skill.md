# Pareto Segmentation

Segment the ranked activities into the core producing most results, the bottom producing little, and the middle. The split is a judgment guided by the ratio distribution, not a rigid eighty-twenty line.

## Inputs

- `ratio-ranked-activities`: Activities ranked by ratio
- `ratio-method-notes`: Assumptions behind the ranking

## Outputs

- `core-activities`: The vital few producing most of the result
- `elimination-candidates`: The low-ratio activities to test for removal
- `optimization-targets`: The middle activities worth improving

## Process

1. Walk down the ranked list and mark where the cumulative output reaches roughly four fifths of the total.
2. Label the activities above that point the core, the vital few that carry the result.
3. Label the lowest-ratio tail as elimination candidates to be tested, not cut blindly.
4. Label the remaining middle band as optimization targets where small gains add up.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
