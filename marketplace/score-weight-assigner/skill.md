# Score Weight Assigner

Assign weights to each scoring criterion and calculate the composite score.

## Inputs

- `scoring-criteria`: Defined criteria for the model
- `data-requirements`: Available data for weight calibration

## Outputs

- `weighted-model`: Model with criteria weights and scoring formula
- `score-range`: Minimum and maximum possible scores

## Process

1. Assign initial weights based on historical default correlation.
2. Calculate the composite score formula.
3. Define the score range and resolution.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
