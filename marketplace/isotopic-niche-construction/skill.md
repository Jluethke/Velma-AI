# Isotopic Niche Construction

Construct the isotopic niche space for each species or group using bivariate isotope data.

## Inputs

- `isotope-values`: Delta-13C and delta-15N values for all samples

## Outputs

- `isotopic-niches`: Standard ellipse areas (SEA) and convex hull areas for each species or group
- `niche-overlap-matrix`: Pairwise overlap between species niches in isotope space

## Process

1. Plot delta-13C vs delta-15N for each species in bivariate isotope space
2. Compute standard ellipse areas corrected for sample size (SEAc) using Bayesian estimation
3. Calculate convex hull total area as a measure of population-level niche width
4. Compute pairwise niche overlap as the proportion of one species' ellipse inside another's

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
