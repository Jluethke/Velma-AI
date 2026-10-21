# Particle Size Measurer

Acquire the particle size measurement data with replicate runs for precision assessment.

## Inputs

- `prepared-sample`: Sample ready for measurement
- `selected-technique`: Instrument and method to use

## Outputs

- `raw-size-data`: Raw measurement output (diffraction pattern, correlation function, sieve masses, images)
- `replicate-summary`: Repeatability of D10, D50, D90 across replicate measurements

## Process

1. Run the background or blank measurement
2. Measure the sample with at least 3 replicates
3. Check that the obscuration (laser diffraction) or count rate (DLS) is in the valid range
4. Record the raw data and compute replicate statistics

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
