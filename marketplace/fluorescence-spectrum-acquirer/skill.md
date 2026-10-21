# Fluorescence Spectrum Acquirer

Import and organize raw excitation and emission spectra from the fluorimeter.

## Inputs

- `raw-spectra-files`: Fluorimeter output files with wavelength and intensity
- `sample-identifiers`: Sample names, concentrations, and solvent for each measurement

## Outputs

- `excitation-spectra`: Corrected excitation spectra per sample
- `emission-spectra`: Corrected emission spectra per sample

## Process

1. Parse fluorimeter output files and separate excitation from emission scans
2. Apply excitation source intensity correction using the reference detector signal
3. Organize spectra by sample identity and measurement condition
4. Flag any spectra with detector saturation or anomalous baselines

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
