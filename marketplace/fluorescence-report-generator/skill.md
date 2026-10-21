# Fluorescence Report Generator

Compile all fluorescence analysis results into a final report with spectra, lifetime plots, and tables.

## Inputs

- `quantum-yield`: Quantum yield results per sample
- `lifetime-fit-results`: Lifetime and decay analysis results
- `fret-efficiency`: FRET efficiency and distance estimates if applicable

## Outputs

- `fluorescence-report`: Structured report with annotated spectra, decay fits, and quantitative summary
- `data-tables`: All computed photophysical parameters in tabular format

## Process

1. Assemble annotated emission spectra and decay curves for each sample
2. Build the summary table of quantum yields, lifetimes, and FRET parameters
3. Write the interpretation connecting photophysical behavior to sample properties
4. Package all data tables and fit parameters for archival

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
