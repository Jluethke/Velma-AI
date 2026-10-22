# Mda Priority Ranker

Combine add value and cut pain into a single priority ranking.

## Inputs

- `add-value-scores`: Benefit scores from the add-dollar test
- `cut-pain-scores`: Pain scores from the cut-dollar test

## Outputs

- `priority-ranking`: Lines ranked from highest to lowest marginal priority
- `reallocation-candidates`: Top lines to fund and bottom lines to trim

## Process

1. Compute a marginal priority for each line from its add value against its cut pain.
2. Sort the lines from highest to lowest priority.
3. Mark the top candidates to fund and the bottom candidates to trim.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
