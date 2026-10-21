# Proteomics Raw Importer

Import and inspect raw mass spectrometry files, checking acquisition quality before processing.

## Inputs

- `raw-files`: Mass spectrometry raw data files
- `acquisition-metadata`: Instrument settings, sample labels, and run order

## Outputs

- `imported-spectra`: Parsed spectra ready for database search
- `quality-summary`: Total spectra, MS2 count, injection time distribution, TIC plots

## Process

1. Parse each raw file and extract MS1 and MS2 spectra.
2. Generate total ion chromatograms and base peak chromatograms for visual QC.
3. Check spray stability, retention time alignment, and injection replicates.
4. Flag runs with anomalous TIC profiles or low MS2 counts.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
