# Fusion Output Validator

Validate the fused output: compare against held-out reference data, check that uncertainty estimates are calibrated, and confirm improvement over individual sensors.

## Inputs

- `fused-estimate`: The combined output
- `reference-data`: Held-out ground truth or independent measurement for validation

## Outputs

- `validation-metrics`: RMSE, bias, and coverage of uncertainty intervals against the reference
- `improvement-summary`: How much the fused output improved over each individual sensor

## Process

1. Compare the fused output to the reference data at matched time points.
2. Compute RMSE, mean bias, and mean absolute error.
3. Check calibration: what fraction of reference values fall within the stated uncertainty bounds.
4. Compare fused RMSE to each individual sensor's RMSE to quantify improvement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
