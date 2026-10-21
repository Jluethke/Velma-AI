# Radiocarbon Calibration

Calibrate radiocarbon ages to calendar years using the appropriate calibration curve.

## Inputs

- `dated-horizons-table`: Raw dates including radiocarbon ages to calibrate
- `calibration-curve`: IntCal20, SHCal20, or Marine20 depending on sample origin

## Outputs

- `calibrated-dates`: Calendar age probability distributions for each radiocarbon date
- `reservoir-corrections`: Any marine or freshwater reservoir corrections applied

## Process

1. Select the calibration curve based on hemisphere and sample environment
2. Apply reservoir corrections for marine or freshwater samples if needed
3. Calibrate each radiocarbon age to produce the calendar age probability distribution
4. Record the median, 1-sigma, and 2-sigma calendar age ranges

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
