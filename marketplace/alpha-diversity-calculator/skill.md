# Alpha Diversity Calculator

Calculate within-site diversity metrics: species richness, Shannon index, Simpson index, and evenness.

## Inputs

- `abundance-matrix`: Site-by-species abundance matrix
- `diversity-indices`: Which indices to compute (default: all standard indices)

## Outputs

- `alpha-diversity-table`: Richness, Shannon H, Simpson D, and Pielou evenness per site
- `confidence-intervals`: Bootstrap confidence intervals for each index per site

## Process

1. Count species richness (S) at each site
2. Compute Shannon entropy H and Simpson concentration D from proportional abundances
3. Compute Pielou evenness J = H / ln(S)
4. Bootstrap resample each site to generate confidence intervals for all indices

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
