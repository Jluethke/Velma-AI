# Defect Density Assessment

Assess defect density in the semiconductor using deep-level transient spectroscopy (DLTS) or photoluminescence (PL) to identify trap levels.

## Inputs

- `device-under-test`: Semiconductor device or sample prepared for DLTS or PL
- `defect-measurement-conditions`: Temperature range, rate windows (DLTS) or excitation wavelength (PL)

## Outputs

- `defect-spectrum`: DLTS peaks or PL spectrum identifying defect energy levels
- `trap-parameters`: Activation energy, capture cross-section, and trap density for each identified level

## Process

1. For DLTS: sweep temperature while recording capacitance transients at selected rate windows
2. Construct the DLTS spectrum (peak height vs temperature) and identify distinct trap levels
3. Extract activation energy and capture cross-section from an Arrhenius plot of the emission rate
4. For PL: measure emission spectrum at cryogenic temperature and assign peaks to known defect transitions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
