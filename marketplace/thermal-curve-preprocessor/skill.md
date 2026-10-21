# Thermal Curve Preprocessor

Preprocess thermal analysis curves: baseline correct, smooth noisy data, and convert to standard units (normalized to sample mass).

## Inputs

- `raw-thermal-data`: DSC or TGA data: temperature/time vs. heat flow or mass
- `sample-metadata`: Sample mass, heating rate, atmosphere, pan type

## Outputs

- `preprocessed-curves`: Baseline-corrected, mass-normalized thermal curves
- `preprocessing-log`: Baseline method, smoothing applied, and any anomalies noted

## Process

1. Normalize heat flow (DSC) or mass (TGA) to the initial sample mass.
2. Correct the baseline using tangent or polynomial fitting in non-transition regions.
3. Apply light smoothing if noise obscures transition features.
4. Check for artifacts: crucible leaks, sample movement, instrument drift.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
