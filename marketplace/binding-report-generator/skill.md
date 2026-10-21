# Binding Report Generator

Compile all binding analysis results into a final receptor pharmacology report.

## Inputs

- `kd-values`: Equilibrium binding parameters
- `ki-values`: Competition assay results
- `cooperativity-assessment`: Cooperativity and binding mechanism conclusions

## Outputs

- `binding-report`: Final report with saturation curves, Scatchard plots, competition curves, and parameter tables
- `pharmacology-data`: All raw and fitted data for archival

## Process

1. Assemble saturation binding curves, Scatchard plots, and competition curves
2. Build the parameter summary table (Kd, Bmax, Ki, Hill coefficient) with confidence intervals
3. Write the interpretation of binding mechanism and receptor pharmacology
4. Package all raw binding data and fitted parameters for archival

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
