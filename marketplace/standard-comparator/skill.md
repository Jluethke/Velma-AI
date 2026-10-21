# Standard Comparator

Express corrected ratios in delta notation relative to international standards and verify accuracy against reference materials.

## Inputs

- `corrected-ratios`: Blank- and fractionation-corrected ratios
- `reference-standard`: International standard (VPDB, VSMOW, AIR, CDT, NBS-987)

## Outputs

- `delta-values`: Isotope ratios expressed as delta per mil relative to the standard
- `accuracy-check`: Reference material results compared to accepted values

## Process

1. Convert corrected ratios to delta notation using the reference standard.
2. Compare measured reference material values to their accepted values.
3. Flag any reference material result outside 2 standard deviations of the accepted value.
4. Report overall analytical accuracy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
