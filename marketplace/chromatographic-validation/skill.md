# Chromatographic Validation

Validate the method against standards for linearity, precision, accuracy, and limits of detection.

## Inputs

- `mobile-phase-composition`: Finalized mobile phase conditions
- `gradient-program`: Gradient or isocratic time program
- `column-selection`: Chosen column type and dimensions

## Outputs

- `validation-results`: Linearity, precision, accuracy, LOD, LOQ for each analyte
- `system-suitability-criteria`: Pass/fail criteria for routine system suitability testing

## Process

1. Prepare calibration standards across the expected concentration range
2. Run replicate injections to assess precision (intra-day and inter-day)
3. Spike known amounts into blank matrix to determine accuracy and recovery
4. Determine limits of detection and quantification from signal-to-noise ratios

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
