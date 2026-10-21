# Accumulation Curve Builder

Build species accumulation and rarefaction curves to assess whether sampling effort was sufficient to capture the community.

## Inputs

- `species-abundance-matrix`: Sites-by-species count matrix
- `sampling-protocol`: Effort at each site for standardization

## Outputs

- `accumulation-curve`: Observed species vs. sampling effort, with confidence bands
- `richness-estimators`: Chao1, ACE, or jackknife estimates of total species richness

## Process

1. Compute the observed species accumulation curve by randomly re-ordering sites.
2. Fit a rarefaction curve to standardize richness across sites with different effort.
3. Calculate non-parametric richness estimators (Chao1 for abundance, Chao2 for incidence).
4. Assess whether the curve has reached an asymptote (sampling is sufficient) or is still rising.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
