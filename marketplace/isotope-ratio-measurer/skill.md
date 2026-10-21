# Isotope Ratio Measurer

Measure parent and daughter isotope ratios on the mass spectrometer.

## Inputs

- `prepared-aliquot`: Chemically prepared sample
- `dating-system`: Isotopic system dictating which ratios to measure

## Outputs

- `measured-ratios`: Isotope ratios with internal precision (2SE)
- `measurement-conditions`: Instrument type, ion beam intensities, and run parameters

## Process

1. Load the sample into the mass spectrometer (TIMS, MC-ICP-MS, or SIMS depending on system)
2. Measure the isotope ratios with sufficient cycles for the target precision
3. Monitor fractionation and correct using the exponential law or a standard
4. Report internal precision as 2 standard errors of the mean

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
