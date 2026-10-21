# Psd Statistics Calculator

Compute summary statistics from the distribution: D10, D50, D90, mean, mode, span, and uniformity coefficient.

## Inputs

- `cumulative-distribution`: Cumulative percent passing vs. size
- `frequency-distribution`: Differential distribution for mode identification

## Outputs

- `summary-statistics`: D10, D50 (median), D90, mean, mode, geometric mean, span, Cu, Cc
- `distribution-shape`: Classification: narrow, broad, bimodal, skewed

## Process

1. Interpolate the cumulative curve to find D10, D50, and D90.
2. Compute the span: (D90 - D10) / D50 as a measure of width.
3. Compute the uniformity coefficient Cu = D60/D10 and coefficient of curvature Cc = D30^2 / (D10 * D60).
4. Characterize the distribution shape: unimodal vs. bimodal, skewness direction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
