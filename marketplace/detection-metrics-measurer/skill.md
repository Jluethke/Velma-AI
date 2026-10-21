# Detection Metrics Measurer

Measure the detection's true positive rate, false positive rate, and performance impact.

## Inputs

- `prototype-detection`: Detection rule or query to measure
- `historical-test-results`: Initial test results

## Outputs

- `detection-metrics`: True positive rate, false positive rate, and query performance
- `threshold-recommendations`: Recommended thresholds and tuning parameters

## Process

1. Calculate true positive rate against labeled attack data or red team exercises
2. Calculate false positive rate against normal business activity
3. Measure query execution time and resource consumption
4. Determine acceptable thresholds for production deployment

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
