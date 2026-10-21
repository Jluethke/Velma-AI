# Charge State Deconvolutor

Deconvolute charge state envelopes to determine true molecular masses.

## Inputs

- `calibrated-spectrum`: Calibrated mass spectrum with charge state series

## Outputs

- `deconvoluted-masses`: List of neutral molecular masses and their intensities
- `charge-state-assignments`: Charge state assignment for each peak in the envelope

## Process

1. Identify charge state series by their characteristic spacing (1/z Da)
2. Assign charge states to each peak in the series
3. Calculate the neutral mass from each charged species and average
4. Report the deconvoluted mass with precision estimate

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
