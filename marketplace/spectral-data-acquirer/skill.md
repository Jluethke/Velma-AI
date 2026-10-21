# Spectral Data Acquirer

Acquire NMR or mass spectrometry data from the metabolite extracts with appropriate quality controls.

## Inputs

- `metabolite-extracts`: Prepared extracts for analysis
- `instrument-method`: Acquisition parameters (NMR pulse sequence, LC-MS gradient, ionization mode)

## Outputs

- `raw-spectra`: Raw spectral data files from the instrument
- `acquisition-log`: Run order, QC injections, and instrument performance metrics

## Process

1. Set up the instrument method and verify with a system suitability standard
2. Run samples in randomized order with QC injections every 10 samples
3. Monitor retention time stability and signal intensity drift
4. Export raw data files and the acquisition log

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
