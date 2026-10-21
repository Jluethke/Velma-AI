# Proxy Calibration Collector

Assemble paired modern proxy measurements and instrumental climate data for calibration.

## Inputs

- `modern-proxy-data`: Proxy measurements from modern samples (e.g., tree ring widths, foram isotopes, pollen counts)
- `instrumental-climate`: Corresponding instrumental temperature, precipitation, or other climate variable

## Outputs

- `calibration-dataset`: Paired proxy-climate values with site metadata
- `data-coverage-summary`: Spatial and temporal coverage of the calibration set

## Process

1. Match proxy sample locations and times to the nearest instrumental climate station or gridded product
2. Screen for outliers and verify that proxy-climate pairings are ecologically plausible
3. Document the spatial and temporal coverage of the calibration set
4. Split into calibration and verification subsets if the dataset is large enough

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
