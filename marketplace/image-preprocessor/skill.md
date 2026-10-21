# Image Preprocessor

Preprocess microscopy images: correct illumination, reduce noise, and enhance contrast to prepare for segmentation.

## Inputs

- `raw-images`: Microscopy images with metadata (magnification, pixel size, channel info)
- `acquisition-parameters`: Microscope type, objective, exposure, and illumination source

## Outputs

- `preprocessed-images`: Corrected and enhanced images ready for segmentation
- `preprocessing-log`: Corrections applied: flat-field, background subtraction, denoising method

## Process

1. Apply flat-field correction to remove illumination non-uniformity.
2. Subtract background using a rolling-ball or morphological opening method.
3. Apply noise reduction (median filter, Gaussian, or non-local means) appropriate to the noise type.
4. Adjust contrast if needed, recording the exact transformation applied.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
