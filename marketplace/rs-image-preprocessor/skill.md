# Rs Image Preprocessor

Preprocess satellite or aerial imagery: atmospheric correction, co-registration, and cloud masking.

## Inputs

- `raw-imagery`: Multi-band satellite or aerial images with metadata
- `reference-data`: Ground control points or reference image for co-registration

## Outputs

- `corrected-imagery`: Surface reflectance images, co-registered and cloud-masked
- `preprocessing-log`: Atmospheric model used, RMS co-registration error, and cloud percentage

## Process

1. Apply atmospheric correction to convert DN to surface reflectance (6S, FLAASH, or Sen2Cor).
2. Co-register to the reference using ground control points or automated feature matching.
3. Generate and apply a cloud and cloud shadow mask.
4. Compute spectral indices (NDVI, NDWI, NDBI) and add as additional bands.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
