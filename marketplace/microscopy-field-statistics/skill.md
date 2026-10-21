# Microscopy Field Statistics

Compute summary statistics across all fields of view: means, distributions, and sample-level estimates.

## Inputs

- `feature-measurements`: Per-feature measurements from all images
- `image-set`: Image metadata for grouping by field

## Outputs

- `summary-statistics`: Mean, SD, median, range for each metric; feature count per field
- `distribution-plots`: Histograms and box plots of key measurements

## Process

1. Pool measurements across all fields of view.
2. Compute descriptive statistics: mean, standard deviation, median, interquartile range.
3. Generate histograms to visualize the distribution of sizes, shapes, and intensities.
4. Report feature density (count per unit area) with confidence intervals.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
