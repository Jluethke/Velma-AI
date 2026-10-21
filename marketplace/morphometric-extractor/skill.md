# Morphometric Extractor

Measure shape and size features for each segmented object: area, perimeter, circularity, aspect ratio, and intensity statistics.

## Inputs

- `segmented-masks`: Labeled object masks
- `preprocessed-images`: Original intensity images for intensity measurements

## Outputs

- `morphometric-table`: Table of measurements for each object (area, perimeter, circularity, intensity)
- `measurement-distributions`: Histograms and summary statistics for each measured feature

## Process

1. Compute geometric features (area, perimeter, major/minor axis, circularity, solidity) for each object.
2. Extract intensity statistics (mean, median, standard deviation) within each object mask.
3. Compute derived features (aspect ratio, form factor, optical density).
4. Build the per-object measurement table.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
