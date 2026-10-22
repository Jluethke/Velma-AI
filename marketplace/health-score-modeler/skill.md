# Health Score Modeler

Weight indicators and set score thresholds.

## Inputs

- `indicator-catalog`: Health indicators to include
- `churn-correlations`: Correlation strengths for weighting

## Outputs

- `scoring-model`: Weighted scoring formula with threshold definitions
- `threshold-definitions`: Healthy, at-risk, and critical thresholds

## Process

1. Weight each indicator based on its churn correlation.
2. Define the scoring formula.
3. Set thresholds for healthy, at-risk, and critical.
4. Validate thresholds against historical churn data.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
