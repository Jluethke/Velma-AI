# Source Detection Cataloger

Detect point sources in calibrated images and produce an initial source catalog with positions and instrumental fluxes.

## Inputs

- `calibrated-frames`: Calibrated science FITS images
- `detection-threshold`: Signal-to-noise threshold for source detection

## Outputs

- `source-catalog`: Table of detected sources with pixel coordinates, instrumental magnitudes, and SNR
- `detection-mask`: Image mask showing detected sources and rejected artifacts

## Process

1. Estimate the sky background and its variation across each frame
2. Run source extraction (SExtractor, DAOFind, or equivalent) at the specified threshold
3. Reject cosmic rays, hot pixels, and extended artifacts
4. Produce the source catalog sorted by brightness

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
