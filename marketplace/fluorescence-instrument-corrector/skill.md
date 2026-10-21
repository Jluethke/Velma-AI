# Fluorescence Instrument Corrector

Apply instrument response corrections to emission spectra for accurate intensity comparison.

## Inputs

- `emission-spectra`: Raw emission spectra per sample
- `instrument-response-function`: Wavelength-dependent detector and optics sensitivity curve

## Outputs

- `corrected-emission`: Instrument-corrected emission spectra
- `correction-factors`: Applied correction curve for documentation

## Process

1. Divide each emission spectrum by the instrument response function
2. Verify that the corrected spectrum of a known standard matches the published shape
3. Subtract solvent blank emission if measured
4. Record the correction factors applied for reproducibility

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
