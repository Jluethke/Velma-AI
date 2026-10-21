# Morphometry Measurer

Measure morphometric parameters for each segmented object: area, perimeter, circularity, aspect ratio, and intensity statistics.

## Inputs

- `segmentation-masks`: Label images with object IDs
- `preprocessed-images`: Original intensity images for intensity-based measurements

## Outputs

- `morphometry-table`: Each object with all measured parameters
- `population-statistics`: Summary statistics (mean, SD, median) for each parameter across all objects

## Process

1. For each labeled object, measure area (in calibrated units), perimeter, and bounding box.
2. Compute shape descriptors: circularity, solidity, aspect ratio, and eccentricity.
3. Measure intensity statistics within each object: mean, median, max, min, integrated density.
4. Compile all measurements into a table with one row per object.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
