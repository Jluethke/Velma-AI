# Psd Data Preprocessor

Preprocess raw particle size data: handle instrument-specific formats, correct for sample preparation artifacts, and compute the cumulative distribution.

## Inputs

- `raw-psd-data`: Size bins and their frequencies (laser diffraction, sieve, or sedimentation data)
- `measurement-method`: Instrument type, dispersant, sonication time, and sample preparation details

## Outputs

- `cumulative-distribution`: Cumulative percent passing vs. particle size
- `frequency-distribution`: Differential volume/number/mass distribution

## Process

1. Convert raw data to a common format: size bins (um) and percent in each bin.
2. Compute the cumulative distribution (percent finer than each size).
3. Compute the frequency (differential) distribution for each bin.
4. Check for multi-modal distributions by examining the frequency curve.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
