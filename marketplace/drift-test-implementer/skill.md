# Drift Test Implementer

Implement statistical tests for drift detection.

## Inputs

- `drift-metrics`: Metrics to monitor
- `reference-distributions`: Reference distributions from training

## Outputs

- `drift-tests`: Implemented statistical tests
- `test-thresholds`: Thresholds for each test

## Process

1. Implement PSI (Population Stability Index) for categorical and binned features.
2. Implement KS test for continuous feature distributions.
3. Implement Jensen-Shannon divergence for prediction distributions.
4. Set thresholds based on acceptable drift levels.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
