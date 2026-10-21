# Cv Analysis Doping

Perform capacitance-voltage analysis to extract the doping profile, oxide thickness, and flatband voltage of the semiconductor structure.

## Inputs

- `device-under-test`: MOS capacitor or gated device for C-V measurement
- `cv-measurement-conditions`: Frequency, AC signal amplitude, DC sweep range, temperature

## Outputs

- `cv-data`: Capacitance vs voltage curves at one or more frequencies
- `doping-profile`: Extracted doping concentration vs depth profile

## Process

1. Measure C-V curve from accumulation through inversion at the specified frequency
2. Extract oxide capacitance from the accumulation region
3. Compute the doping profile from the slope of the 1/C-squared vs V plot
4. Check for frequency dispersion (compare curves at multiple frequencies) as a quality indicator

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
