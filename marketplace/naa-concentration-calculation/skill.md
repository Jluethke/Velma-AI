# Naa Concentration Calculation

Quantify elemental concentrations by comparing sample activities to standards.

## Inputs

- `corrected-activities`: Corrected net activities for all samples and standards
- `counting-log`: Timing and geometry data for decay and efficiency corrections

## Outputs

- `elemental-concentrations`: Concentration of each element in each sample with uncertainties
- `quality-metrics`: Detection limits, precision, and accuracy against reference materials

## Process

1. Apply the comparator method: ratio sample activity to standard activity with decay corrections
2. Calculate mass fractions for each element from the activity ratios
3. Compute detection limits for elements below the quantification threshold
4. Validate accuracy by comparing measured reference material values to certified values

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
