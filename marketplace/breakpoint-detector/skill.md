# Breakpoint Detector

Detect breakpoints in the difference series (target minus reference): use statistical tests to find times where the mean or variance shifts.

## Inputs

- `target-station-data`: The target climate record
- `reference-composite`: The composite reference series

## Outputs

- `breakpoint-list`: Detected breakpoint dates with confidence intervals and shift magnitudes
- `difference-series`: Target minus reference series with breakpoints marked

## Process

1. Compute the difference (or ratio for precipitation) between target and reference.
2. Apply a penalized likelihood or SNHT (Standard Normal Homogeneity Test) to detect shifts.
3. Estimate the timing and magnitude of each detected shift.
4. Apply a significance threshold to avoid detecting noise as breakpoints.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
