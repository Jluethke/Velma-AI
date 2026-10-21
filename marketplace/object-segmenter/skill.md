# Object Segmenter

Segment individual objects (cells, nuclei, particles) from the preprocessed images using thresholding, watershed, or other appropriate method.

## Inputs

- `preprocessed-images`: Enhanced microscopy images
- `segmentation-parameters`: Expected object size range, shape, and intensity characteristics

## Outputs

- `segmentation-masks`: Label images where each object has a unique integer ID
- `segmentation-summary`: Total objects detected, objects touching borders (excluded), and split/merge events

## Process

1. Choose a segmentation approach based on object characteristics (threshold, watershed, or contour-based).
2. Apply the segmentation and label connected components.
3. Split touching objects using watershed or distance-transform-based separation.
4. Exclude objects touching the image border and objects below the minimum size threshold.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
