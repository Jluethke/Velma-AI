# Ms Spectrum Acquirer

Acquire the mass spectrum of the target sample.

## Inputs

- `sample-introduction`: Sample preparation and introduction method (direct injection, LC, GC)
- `instrument-parameters`: Ionization mode, scan range, and resolution settings

## Outputs

- `raw-spectrum`: Mass-to-charge ratio vs intensity data
- `acquisition-metadata`: Instrument type, ionization method, and acquisition parameters

## Process

1. Introduce the sample using the appropriate inlet (ESI, MALDI, EI, APCI)
2. Acquire the full-scan mass spectrum across the defined m/z range
3. Acquire MS/MS spectra for the most intense precursor ions
4. Save raw data with complete metadata for reprocessing

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
