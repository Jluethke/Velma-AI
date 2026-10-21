# Fractionation Corrector

Correct raw isotope ratios for instrumental mass fractionation, isobaric interferences, and blank contributions.

## Inputs

- `raw-ratios`: Measured ratios from the instrument
- `instrument-log`: Run metadata for drift correction

## Outputs

- `corrected-ratios`: Ratios after fractionation, interference, and blank corrections
- `correction-log`: Magnitude of each correction applied to each sample

## Process

1. Apply mass bias correction using the bracketing standards or internal normalization.
2. Subtract isobaric interference contributions (e.g., Rb on Sr, Hg on Pb).
3. Subtract the procedural blank contribution.
4. Propagate uncertainties through each correction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
