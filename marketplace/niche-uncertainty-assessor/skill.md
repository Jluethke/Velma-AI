# Niche Uncertainty Assessor

Quantify and communicate uncertainty in the niche model predictions.

## Inputs

- `trained-model`: Fitted niche model
- `evaluation-metrics`: Model performance statistics
- `suitability-map`: Continuous suitability predictions

## Outputs

- `uncertainty-map`: Spatial map of prediction uncertainty (standard deviation or range across replicates)
- `niche-model-report`: Final report including methods, results, uncertainty, and recommendations

## Process

1. Run bootstrap or ensemble replicates to quantify prediction variance
2. Map the standard deviation or coefficient of variation across replicates
3. Identify regions where predictions are least certain
4. Compile the full report with methods, evaluation, projections, and uncertainty assessment

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
