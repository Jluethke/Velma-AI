# Microstructure Imaging Sem Tem

Image microstructure with SEM and TEM: capture secondary and backscatter images, run EDS for composition, and measure grain sizes.

## Inputs

- `sample-inventory`: Polished and coated samples for electron microscopy
- `xrd-results`: Known phases to locate and confirm in images

## Outputs

- `microstructure-images`: Annotated SEM and TEM micrographs at multiple magnifications
- `eds-composition-maps`: Elemental distribution maps and spot analysis results
- `grain-size-distribution`: Measured grain size statistics (mean, standard deviation, histogram)

## Process

1. Image at low magnification for overview, then at high magnification for features
2. Collect secondary electron images for topography and backscatter for composition contrast
3. Run EDS point analysis and mapping on regions of interest
4. Measure grain sizes using intercept or area methods on calibrated images

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
