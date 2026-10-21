# Rarefaction Curve Generator

Generate rarefaction and extrapolation curves to compare diversity at equal sampling effort.

## Inputs

- `abundance-matrix`: Site-by-species abundance matrix
- `sampling-effort`: Effort data per site for standardization

## Outputs

- `rarefaction-curves`: Sample-based or individual-based rarefaction curves per site
- `estimated-richness`: Chao1 or ACE estimated total species richness per site

## Process

1. Compute the rarefaction curve for each site by subsampling without replacement
2. Extrapolate beyond observed effort using the Chao1 or iNEXT method
3. Plot rarefaction and extrapolation curves with 95% confidence bands
4. Report asymptotic richness estimates and sample completeness ratios

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
