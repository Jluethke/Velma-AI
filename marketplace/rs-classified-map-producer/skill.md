# Rs Classified Map Producer

Apply the trained classifier to the full image and produce the final land cover map.

## Inputs

- `trained-classifier`: Validated classification model
- `corrected-imagery`: Full preprocessed image
- `accuracy-metrics`: Validation accuracy results

## Outputs

- `classified-map`: Raster land cover map with class labels and legend
- `classification-report`: Methods, accuracy assessment, and area estimates per class

## Process

1. Apply the classifier to every pixel in the image extent.
2. Apply post-classification filtering (minimum mapping unit, majority filter) to reduce salt-and-pepper noise.
3. Compute area estimates per class with confidence intervals adjusted for classification error.
4. Export the map as a GeoTIFF with proper projection, legend, and metadata.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
