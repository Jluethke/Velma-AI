# Rs Training Sampler

Collect training and validation samples for the land cover classes of interest.

## Inputs

- `corrected-imagery`: Preprocessed multi-band imagery
- `class-definitions`: Target land cover classes with descriptions and examples

## Outputs

- `training-samples`: Labeled pixel locations with class assignments
- `validation-samples`: Independent labeled pixels reserved for accuracy assessment

## Process

1. Define the classification scheme with clear, mutually exclusive class definitions.
2. Collect training polygons from field visits, very-high-resolution imagery, or existing maps.
3. Split samples into training (70%) and validation (30%) ensuring spatial separation.
4. Check class balance and augment under-represented classes if needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
