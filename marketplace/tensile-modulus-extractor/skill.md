# Tensile Modulus Extractor

Compute the elastic modulus from the slope of the linear elastic region of each curve.

## Inputs

- `stress-strain-curves`: Engineering stress vs engineering strain per specimen
- `elastic-region-fit`: Linear fit parameters identifying the elastic region bounds

## Outputs

- `elastic-moduli`: Young's modulus per specimen with R-squared of the fit
- `modulus-statistics`: Mean, standard deviation, and coefficient of variation across specimens

## Process

1. Use the previously identified elastic region bounds for each specimen
2. Compute the slope of the linear fit within those bounds
3. Report the modulus with the fit quality metric
4. Compute summary statistics across all specimens

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
