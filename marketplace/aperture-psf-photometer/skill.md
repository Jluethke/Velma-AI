# Aperture Psf Photometer

Perform aperture photometry or PSF-fitting photometry on detected sources to measure precise instrumental magnitudes.

## Inputs

- `calibrated-frames`: Calibrated science images
- `source-catalog`: Catalog of detected sources with positions

## Outputs

- `photometry-table`: Instrumental magnitudes with uncertainties for each source on each frame
- `photometry-diagnostics`: Growth curves, PSF model, and aperture correction values

## Process

1. Choose aperture photometry (isolated fields) or PSF fitting (crowded fields)
2. For aperture: measure flux in concentric apertures, determine optimal aperture, apply aperture correction
3. For PSF: build the PSF model from bright stars, fit to all sources, subtract neighbors
4. Record instrumental magnitudes and their uncertainties

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
