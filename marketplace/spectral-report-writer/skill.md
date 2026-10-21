# Spectral Report Writer

Produce the spectral analysis report with annotated spectrum plots, peak table, feature summary, and methods description.

## Inputs

- `spectral-features`: Computed feature table
- `fitted-peaks`: Fitted peak table
- `acquisition-report`: Data quality and acquisition parameters

## Outputs

- `spectral-report`: Complete spectral analysis report with figures and tables
- `spectral-figures`: Annotated spectrum, peak fits, and feature plots

## Process

1. Generate the annotated spectrum plot with peak labels and noise floor.
2. Build the peak parameter table and feature summary table.
3. Write the methods section covering acquisition, windowing, transform, and fitting.
4. Compile the figures, tables, and narrative into the final report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
