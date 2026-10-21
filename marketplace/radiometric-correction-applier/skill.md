# Radiometric Correction Applier

Apply corrections for common lead, blank, fractionation, and interference.

## Inputs

- `measured-ratios`: Raw isotope ratios
- `preparation-log`: Blank levels and spike calibration

## Outputs

- `corrected-ratios`: Isotope ratios after all corrections
- `correction-summary`: Magnitude and uncertainty of each correction applied

## Process

1. Subtract the procedural blank contribution from each ratio
2. Correct for common lead using the appropriate model (Stacey-Kramers or measured)
3. Apply mass fractionation correction if not already done during measurement
4. Propagate the uncertainty from each correction through to the final ratios

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
