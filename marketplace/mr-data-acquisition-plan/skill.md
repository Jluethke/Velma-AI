# Mr Data Acquisition Plan

Plan the magnetic resonance acquisition: select the experiment type, pulse sequence, and acquisition parameters.

## Inputs

- `sample-or-subject`: Description of the sample (NMR) or subject (MRI)
- `analysis-question`: What structural or spatial information is needed

## Outputs

- `acquisition-protocol`: Pulse sequence, parameters, and expected run time
- `raw-mr-data`: Free induction decay (NMR) or k-space data (MRI)

## Process

1. Select the nucleus (1H, 13C, 31P for NMR) or contrast weighting (T1, T2, diffusion for MRI).
2. Choose the pulse sequence and set repetition time, echo time, spectral width, and number of scans.
3. Acquire the data and verify signal-to-noise ratio meets the analysis requirements.
4. Export the raw data in a standard format (JCAMP-DX for NMR, DICOM for MRI).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
