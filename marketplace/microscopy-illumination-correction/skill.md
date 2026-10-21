# Microscopy Illumination Correction

Correct for uneven illumination (vignetting, shading) across the field of view.

## Inputs

- `image-set`: Raw captured images
- `capture-protocol`: Acquisition parameters

## Outputs

- `corrected-images`: Flat-field corrected images
- `correction-quality-metrics`: Uniformity measures before and after correction

## Process

1. Acquire or generate a flat-field reference image (empty field with same illumination).
2. Divide each image by the flat-field reference to normalize illumination.
3. Verify correction by checking intensity uniformity across the field.
4. Apply background subtraction if needed for fluorescence images.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
