# Spectra Preprocessor

Preprocess raw mass spectrometry data: convert to open format, filter noise, deisotope, and extract MS2 spectra for database searching.

## Inputs

- `raw-ms-data`: Vendor-format mass spectrometry files
- `acquisition-parameters`: Instrument type, resolution, fragmentation method (HCD, CID, ETD)

## Outputs

- `processed-spectra`: Cleaned MS2 spectra in open format (mzML or MGF)
- `preprocessing-report`: Spectra count before/after filtering, noise level, and charge state distribution

## Process

1. Convert raw vendor files to mzML format.
2. Filter out spectra below a minimum intensity threshold.
3. Deisotope and deconvolute charge states to monoisotopic masses.
4. Extract MS2 spectra with their precursor mass and charge for database searching.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
