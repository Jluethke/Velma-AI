# Chronology Report

Produce the final chronology report with the age-depth plot and supporting data.

## Inputs

- `age-depth-model`: Final age model with confidence intervals
- `accumulation-rate`: Sedimentation rate profile
- `dated-horizons-table`: Original dated horizons for display on the plot

## Outputs

- `chronology-report`: Report including the age-depth plot, accumulation rates, methods, and data tables
- `age-model-output-file`: Machine-readable file of depth vs age for use in proxy interpretation

## Process

1. Generate the age-depth plot with dated horizons, median model, and 95% envelope
2. Plot the sedimentation rate profile with uncertainty bands
3. Write the methods section documenting model choice, parameters, and outlier handling
4. Export the age model as a table and file for downstream proxy-age assignment

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
