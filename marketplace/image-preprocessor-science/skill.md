# Image Preprocessor Science

Preprocess scientific images with noise reduction, contrast adjustment, and background correction.

## Inputs

- `raw-images`: Set of raw scientific images (microscopy, satellite, medical)
- `preprocessing-params`: Filter type, kernel size, contrast method

## Outputs

- `preprocessed-images`: Cleaned images ready for segmentation
- `preprocessing-log`: Filters applied, before/after metrics, and rejected images

## Process

1. Apply noise reduction (Gaussian, median, or non-local means) to each image.
2. Correct uneven illumination or background gradient.
3. Adjust contrast using histogram equalization or CLAHE.
4. Log all parameters and flag images that remain below quality threshold.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
