# Spectral Compensation Applier

Compensate for spectral overlap between fluorochromes using single-stain controls.

## Inputs

- `parsed-events`: Raw event-level data
- `panel-definition`: Fluorochrome panel with expected spillover

## Outputs

- `compensated-events`: Event data after compensation matrix application
- `compensation-matrix`: Spillover matrix used, with QC metrics

## Process

1. Calculate the spillover matrix from single-stain control samples
2. Invert the spillover matrix to produce the compensation matrix
3. Apply the compensation matrix to all event data
4. Verify compensation by checking that negative populations center at zero on each channel

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
