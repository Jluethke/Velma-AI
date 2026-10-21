# Photometry Spectroscopy Extractor

Extract photometry (aperture or PSF) or spectra (trace, extract, wavelength calibrate) from reduced images.

## Inputs

- `reduced-images`: Calibrated images or spectral frames
- `target-list`: Source positions and expected brightness

## Outputs

- `raw-measurements`: Instrumental magnitudes or extracted spectra with error estimates
- `extraction-diagnostics`: PSF fits, aperture curves of growth, or trace profiles for quality assessment
- `comparison-star-data`: Measurements of comparison and check stars for differential photometry

## Process

1. Detect sources and centroid on the target and comparison stars
2. Perform aperture photometry at multiple radii or fit a PSF model
3. For spectra: trace the order, extract with optimal extraction, and wavelength calibrate from arc lamps
4. Record instrumental measurements with Poisson and background error propagation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
