# Initial Rate Extractor

Extract initial reaction rates from progress curves: identify the linear phase, compute the slope, and flag curves where the linear phase is too short.

## Inputs

- `progress-curves`: Product or substrate concentration vs. time for each substrate concentration
- `assay-conditions`: Enzyme concentration, temperature, pH, buffer composition

## Outputs

- `rate-table`: Substrate concentration and initial rate (v0) for each condition
- `linearity-report`: Duration of the linear phase for each curve and any flagged conditions

## Process

1. For each progress curve, identify the initial linear region (before >10% substrate depletion).
2. Fit a line to the linear region and extract the slope as v0.
3. Flag curves where the linear region is shorter than 3 time points.
4. Record assay conditions (temperature, pH) alongside each rate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
