# Annotation Validator

Validate automated segmentation and classification against manual expert annotations on a subset of images.

## Inputs

- `segmented-masks`: Automated segmentation masks
- `manual-annotations`: Expert-drawn annotations on a validation subset

## Outputs

- `validation-scores`: Dice coefficient, IoU, precision, recall, and F1 for segmentation and classification
- `error-examples`: Gallery of cases where automation disagreed most with the expert

## Process

1. Match automated objects to manual annotations by overlap.
2. Compute pixel-level Dice coefficient and IoU.
3. Compute object-level precision, recall, and F1.
4. Extract the top disagreement cases for visual review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
