# Photometry Report Writer

Compile the photometric analysis into a report with calibration details, light curves, model fits, and interpretation.

## Inputs

- `best-fit-parameters`: Fitted model parameters and comparison metrics
- `light-curve`: The assembled light curve data
- `calibration-residuals`: Photometric calibration quality metrics

## Outputs

- `photometry-report`: Complete photometry report with methods, results, and figures
- `data-products`: Machine-readable light curve and model parameters for archival

## Process

1. Structure the report: observations, reduction, calibration, light curve, model, interpretation
2. Embed key figures (finding chart, light curve, model overlay, residuals)
3. Write the physical interpretation of the model parameters
4. Package data products in standard formats (CSV, VOTable)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
