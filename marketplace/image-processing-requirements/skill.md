# Image Processing Requirements

Define the batch processing steps and quality requirements.

## Inputs

- `use-case`: What the processed images are used for (web publishing, print, social media, product catalog, thumbnails)
- `source-format`: Input image format and typical dimensions

## Outputs

- `processing-steps`: Ordered list of operations (resize, crop, watermark, compress, convert) with parameters
- `quality-criteria`: Acceptable output quality (minimum resolution, maximum file size, visual check criteria)

## Process

1. Define each processing step in order: resize to target dimensions, crop to aspect ratio, apply watermark, compress, convert format.
2. Set the parameters for each step (e.g., resize to 1200x800, compress to 85% quality, output as WebP).
3. Define the quality criteria: minimum resolution, maximum file size, no visible artifacts, watermark positioned correctly.
4. Document the processing steps and quality criteria.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
