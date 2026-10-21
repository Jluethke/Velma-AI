# Reconstruction Uncertainty Estimator

Quantify uncertainty in the paleoclimate reconstruction from calibration error, chronology, and sample-specific analogue quality.

## Inputs

- `climate-reconstruction`: Raw reconstructed climate time series
- `calibration-statistics`: RMSEP and model residual distribution
- `analogue-quality`: Per-sample analogue distance or fit metric

## Outputs

- `uncertainty-envelope`: Confidence bands around the reconstruction at each time point
- `uncertainty-decomposition`: Relative contributions of calibration, chronology, and analogue quality to total uncertainty

## Process

1. Apply the calibration RMSEP as a baseline uncertainty at every sample
2. Inflate uncertainty for samples with poor modern analogues
3. Incorporate chronological uncertainty if an age model with error estimates is provided
4. Produce the final reconstruction with upper and lower confidence bands

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
