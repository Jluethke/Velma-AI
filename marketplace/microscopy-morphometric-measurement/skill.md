# Microscopy Morphometric Measurement

Measure size, shape, and intensity of each segmented feature.

## Inputs

- `segmentation-masks`: Labeled feature masks
- `corrected-images`: Original intensity images for intensity measurements

## Outputs

- `feature-measurements`: Per-feature table: area, perimeter, circularity, aspect ratio, mean intensity
- `measurement-units`: Calibration applied (micrometers, pixels)

## Process

1. For each labeled region, compute area, perimeter, bounding box, centroid.
2. Calculate shape descriptors: circularity, aspect ratio, solidity, eccentricity.
3. Measure mean, median, and standard deviation of intensity within each region.
4. Apply pixel-to-micrometer calibration to convert measurements to physical units.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
