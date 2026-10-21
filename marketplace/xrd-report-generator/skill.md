# Xrd Report Generator

Compile all XRD analysis results into a structured report with annotated diffractograms and tables.

## Inputs

- `phase-identification`: Matched phases with confidence scores
- `refined-parameters`: Lattice parameters and phase fractions
- `crystallite-size`: Size and microstrain estimates

## Outputs

- `xrd-report`: Final report with annotated plots, phase table, and conclusions
- `supplementary-data`: Rietveld fit plots, residual curves, and raw peak data

## Process

1. Assemble the annotated diffractogram showing identified peaks and phases
2. Tabulate phase fractions, lattice parameters, and crystallite sizes
3. Write the interpretation section linking results to the sample context
4. Package the supplementary fit data for archival

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
