# Crystal Quality Assessor

Assess crystal and diffraction data quality for structure determination suitability.

## Inputs

- `diffraction-dataset`: Processed diffraction data
- `data-collection-log`: Collection parameters

## Outputs

- `quality-assessment`: Resolution, completeness, Rmerge, I/sigma, mosaicity, and Wilson B-factor
- `crystal-screening-report`: Full report from initial screening through data quality, with recommendations

## Process

1. Evaluate resolution limits using CC1/2 and I/sigma criteria
2. Check completeness, redundancy, and Rmerge across resolution shells
3. Assess mosaicity and ice ring contamination
4. Compile the full screening report with recommendations for structure determination or further optimization

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
