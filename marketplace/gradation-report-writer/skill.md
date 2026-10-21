# Gradation Report Writer

Write the particle size distribution report: the gradation curve, summary statistics, fitted model, classification, and specification compliance.

## Inputs

- `summary-statistics`: PSD summary parameters
- `fitted-models`: Distribution model fit results
- `classification-result`: Standard classification

## Outputs

- `gradation-report`: Structured PSD report with plots and tables
- `gradation-curve-figure`: Publication-ready cumulative and frequency distribution plots

## Process

1. Plot the cumulative distribution on a log-probability or semi-log scale.
2. Overlay the fitted model curve on the data.
3. Present the summary statistics table (D10, D50, D90, span, Cu, Cc).
4. State the classification result and specification compliance status.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
