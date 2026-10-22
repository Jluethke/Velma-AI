# Measurement Uncertainty Analysis

Evaluate measurement uncertainty using the GUM (Guide to the Expression of Uncertainty in Measurement) framework with Type A (statistical) and Type B (non-statistical) components.

## Inputs

- `measurement-process`: Description of the measurement: parameter, instrument, method, environmental conditions
- `accuracy-requirement`: Required measurement accuracy for the parameter (from product specification or test tolerance)

## Outputs

- `uncertainty-budget`: Table of all uncertainty contributors with their type (A or B), distribution, standard uncertainty, sensitivity coefficient, and contribution to combined uncertainty
- `expanded-uncertainty`: Combined standard uncertainty multiplied by coverage factor k (typically k=2 for 95% confidence)
- `test-uncertainty-ratio`: TUR = tolerance / expanded_uncertainty. Minimum acceptable TUR is 4:1 per ANSI/NCSL Z540.3; values below this require guard-banding

## Process

1. Identify all sources of uncertainty in the measurement. Common sources: instrument accuracy (from calibration certificate), resolution (half the least significant digit), repeatability (from repeated measurements), reproducibility (operator and environment variation), temperature coefficient, stability since last calibration, and reference standard uncertainty.
2. For Type A evaluation (statistical): take at least 10 repeated measurements under repeatability conditions. Calculate the standard deviation. The standard uncertainty is s/sqrt(n) where s is the standard deviation and n is the number of measurements.
3. For Type B evaluation (non-statistical): use manufacturer specifications, calibration certificates, or engineering judgment. For a rectangular distribution (specification limit with no additional information), the standard uncertainty is specification_limit / sqrt(3). For a normal distribution (calibration certificate with stated uncertainty), divide the expanded uncertainty by the coverage factor.
4. Combine all uncertainty sources using root-sum-of-squares: u_combined = sqrt(sum of (sensitivity_coefficient_i * u_i)^2). Multiply by coverage factor k to get expanded uncertainty U. For k=2, the measurement result lies within plus or minus U with approximately 95% confidence.
5. Calculate the test uncertainty ratio: TUR = product_tolerance / (2 * U). If TUR is 4:1 or better, simple pass/fail decisions at the tolerance limits are adequate. If TUR is below 4:1, either improve the measurement (lower uncertainty) or apply guard-banding to maintain the specified consumer risk.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
