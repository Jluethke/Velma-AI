# Crystallographic Analysis Xrd

Run X-ray diffraction on prepared samples: collect diffractograms, identify phases, refine lattice parameters, and assess crystallinity.

## Inputs

- `sample-inventory`: Powder or thin-film samples prepared for XRD
- `material-description`: Expected composition and crystal system

## Outputs

- `xrd-results`: Phase IDs, lattice parameters, crystallite size, and strain estimates
- `diffractograms`: Annotated diffraction patterns with peak assignments
- `phase-fractions`: Quantitative phase analysis results if multiphase

## Process

1. Collect diffractograms at appropriate scan rate and angular range
2. Match peaks to reference patterns (ICDD database) for phase identification
3. Refine lattice parameters using Rietveld or Le Bail methods
4. Estimate crystallite size and microstrain from peak broadening

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
