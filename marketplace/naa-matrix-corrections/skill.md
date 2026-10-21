# Naa Matrix Corrections

Correct for self-shielding, matrix effects, and spectral interferences.

## Inputs

- `peak-assignments`: Identified peaks with net areas
- `interference-flags`: Overlapping peak issues
- `sample-material`: Matrix composition for self-shielding calculation

## Outputs

- `corrected-activities`: Corrected net activities for each isotope in each sample
- `correction-factors`: Self-shielding, coincidence summing, and interference correction factors applied

## Process

1. Calculate neutron self-shielding factors based on sample mass and composition
2. Apply coincidence summing corrections for isotopes with cascade gamma emissions
3. Subtract spectral interference contributions from overlapping peaks
4. Propagate uncertainties through all correction factors

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
