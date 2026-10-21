# Roi Segmenter

Segment regions of interest in the preprocessed images using thresholding, watershed, or machine learning methods.

## Inputs

- `preprocessed-images`: Cleaned images
- `segmentation-method`: Otsu threshold, watershed, U-Net, or manual seeds

## Outputs

- `segmented-masks`: Binary or labeled masks identifying each region of interest
- `segmentation-stats`: Object count, coverage fraction, and segmentation confidence per image

## Process

1. Apply the chosen segmentation algorithm.
2. Post-process masks (fill holes, remove small objects, split touching objects).
3. Label each connected region with a unique ID.
4. Report object count and coverage fraction for each image.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
