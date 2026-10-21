# Soil Health Scorer

Score overall soil health: integrate physical (texture, compaction), chemical (pH, CEC, nutrients), and biological (organic matter, respiration) indicators.

## Inputs

- `texture-classification`: Physical soil properties
- `nutrient-ratings`: Chemical soil status
- `organized-results`: Organic matter, pH, CEC, and any biological indicators

## Outputs

- `soil-health-score`: Composite score with sub-scores for physical, chemical, and biological health
- `limiting-factors`: The one or two factors most limiting soil function

## Process

1. Score each indicator on a common scale (0-100) using established scoring functions.
2. Compute sub-scores for physical, chemical, and biological health.
3. Identify the limiting factor: the lowest-scoring indicator that constrains productivity.
4. Compute the composite score and compare to regional benchmarks.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
