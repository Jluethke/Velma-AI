# Sediment Age Depth Model

Build the age-depth model from radiocarbon dates, lead-210, or other chronological markers.

## Inputs

- `dating-results`: Radiocarbon ages, Pb-210 activities, or tephra identifications with depths
- `core-log`: Visual log noting any hiatuses or disturbed sections

## Outputs

- `age-model`: Age-depth relationship with uncertainty envelope
- `sedimentation-rates`: Accumulation rates (cm/yr or g/cm2/yr) through the core

## Process

1. Calibrate radiocarbon ages using the appropriate curve (IntCal, SHCal, or Marine).
2. Exclude dates from reworked material or known contaminants.
3. Build the age-depth model using Bayesian methods (Bacon, OxCal, or rbacon).
4. Extract sedimentation rates and their uncertainties for each interval.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
