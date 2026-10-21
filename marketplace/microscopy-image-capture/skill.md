# Microscopy Image Capture

Capture microscopy images with consistent illumination, focus, and exposure settings across all fields of view.

## Inputs

- `specimen-description`: What is being imaged and at what magnification
- `quantification-targets`: Which features need to be measured (size, count, shape, intensity)

## Outputs

- `image-set`: Set of captured images with metadata (magnification, pixel size, exposure)
- `capture-protocol`: Settings used for reproducibility

## Process

1. Set up Kohler illumination and white balance for consistent lighting.
2. Select magnification and verify pixel-to-micrometer calibration with a stage micrometer.
3. Capture images at randomly selected or systematically spaced fields of view.
4. Record all acquisition parameters for the protocol.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
