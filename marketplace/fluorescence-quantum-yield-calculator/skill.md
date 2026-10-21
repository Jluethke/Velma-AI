# Fluorescence Quantum Yield Calculator

Calculate fluorescence quantum yield using the comparative method with a known reference.

## Inputs

- `corrected-emission`: Instrument-corrected emission spectra for sample and reference
- `absorbance-values`: Absorbance at excitation wavelength for sample and reference

## Outputs

- `quantum-yield`: Absolute quantum yield with uncertainty per sample
- `calculation-details`: Integrated emission areas, refractive index corrections, and reference values used

## Process

1. Integrate emission spectra over the full emission band for both sample and reference
2. Apply the comparative quantum yield formula with refractive index correction
3. Verify that absorbance values are in the optically dilute regime (below 0.1)
4. Report quantum yield with propagated uncertainty from absorbance and integration

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
