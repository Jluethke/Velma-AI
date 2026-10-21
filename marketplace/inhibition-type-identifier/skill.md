# Inhibition Type Identifier

If inhibitor data is present, determine the inhibition type: competitive, uncompetitive, noncompetitive, or mixed, by comparing fits.

## Inputs

- `rate-table`: Rates at multiple substrate and inhibitor concentrations
- `mm-parameters`: Uninhibited Km and Vmax as baseline

## Outputs

- `inhibition-type`: The identified inhibition mechanism with Ki
- `inhibition-evidence`: Model comparison (AIC/F-test) and diagnostic plots supporting the assignment

## Process

1. Fit competitive, uncompetitive, noncompetitive, and mixed inhibition models to the data.
2. Compare models using AIC or the extra-sum-of-squares F-test.
3. Check diagnostic patterns: Lineweaver-Burk lines converging at y-axis (competitive) vs. x-axis (uncompetitive).
4. Report Ki and the inhibition type with the model comparison evidence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
