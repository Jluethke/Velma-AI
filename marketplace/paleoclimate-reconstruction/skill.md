# Paleoclimate Reconstruction

Use the calibrated growth-climate relationship to reconstruct the climate variable back through the full length of the tree-ring chronology.

## Inputs

- `site-chronology`: Full tree-ring chronology
- `correlation-results`: Calibrated growth-climate relationship and optimal season

## Outputs

- `climate-reconstruction`: Reconstructed climate variable with uncertainty envelope for the full chronology period
- `verification-statistics`: Split-period calibration-verification results (RE, CE, r-squared)

## Process

1. Build the transfer function using linear regression or scaling over the calibration period
2. Validate using a split-period or leave-one-out cross-validation
3. Compute reduction of error (RE) and coefficient of efficiency (CE) statistics
4. Apply the transfer function to the full chronology and attach the reconstruction uncertainty envelope

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
