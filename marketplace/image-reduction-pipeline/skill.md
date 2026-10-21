# Image Reduction Pipeline

Reduce raw CCD images: subtract bias, apply flat field, remove cosmic rays, align frames, and co-add for each target and filter.

## Inputs

- `calibration-plan`: Bias, flat, and dark frames collected
- `night-schedule`: Which science frames were taken

## Outputs

- `reduced-images`: Calibrated, cosmic-ray-cleaned, aligned, and co-added images per target and filter
- `reduction-log`: Processing steps, software versions, and quality metrics per frame
- `rejection-list`: Frames rejected for trailing, clouds, or abnormal background

## Process

1. Build master bias, dark, and flat from calibration frames
2. Subtract bias and dark, divide by flat for each science frame
3. Detect and interpolate over cosmic rays
4. Align frames using field stars and co-add with sigma clipping
5. Inspect reduced images and reject any with artifacts

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
