# Microscopy Feature Segmentation

Segment features of interest from the background using threshold, watershed, or machine learning methods.

## Inputs

- `corrected-images`: Illumination-corrected images
- `quantification-targets`: Which features to segment

## Outputs

- `segmentation-masks`: Binary or labeled masks identifying each feature instance
- `segmentation-parameters`: Method and thresholds used

## Process

1. Select the segmentation approach based on contrast: global threshold, adaptive threshold, or watershed for touching objects.
2. Apply morphological operations (opening, closing) to clean the mask.
3. Separate touching features using watershed or distance transform.
4. Visually verify segmentation on a subset and adjust parameters if needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
