# Colocalization Analyzer

If multi-channel images are available, analyze colocalization: compute Pearson's, Manders', and overlap coefficients between channels within segmented objects.

## Inputs

- `preprocessed-images`: Multi-channel images
- `segmentation-masks`: Object regions to analyze

## Outputs

- `colocalization-metrics`: Per-object and population-level colocalization coefficients
- `colocalization-maps`: Pixel-level colocalization visualization (scatter plots, overlap images)

## Process

1. Within each segmented object, extract pixel intensities from both channels.
2. Compute Pearson's correlation coefficient between the two channels.
3. Compute Manders' M1 and M2 coefficients (fraction of each channel overlapping with the other).
4. Generate a scatter plot of channel 1 vs. channel 2 intensity and an overlap map.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
