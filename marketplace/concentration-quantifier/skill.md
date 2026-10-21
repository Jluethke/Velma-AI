# Concentration Quantifier

Quantify compound concentrations from peak areas using external or internal standard calibration curves.

## Inputs

- `identified-peaks`: Peaks with their compound assignments and areas
- `calibration-data`: Standard concentrations and their peak areas, or internal standard response factors

## Outputs

- `concentration-table`: Each compound with its calculated concentration and uncertainty
- `calibration-quality`: Calibration curve fit, linearity range, LOD, and LOQ

## Process

1. Fit calibration curves (linear or weighted linear) for each target compound.
2. Check linearity over the calibration range (R-squared, residual pattern).
3. Calculate the concentration of each identified peak from its area and the calibration curve.
4. Estimate the limit of detection (LOD) and limit of quantification (LOQ) from the calibration.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
