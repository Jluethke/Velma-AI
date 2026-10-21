# Soil Suitability Interpreter

Interpret the combined physical, chemical, and biological results for land use suitability.

## Inputs

- `physical-results`: Soil physical property measurements
- `chemical-results`: Soil chemical property measurements
- `biological-results`: Soil biological activity measurements

## Outputs

- `suitability-assessment`: Land use suitability ratings for agriculture, construction, and conservation
- `amendment-recommendations`: Specific soil amendments with application rates to address deficiencies

## Process

1. Score each property against standard suitability criteria for the intended land use.
2. Identify limiting factors (drainage, acidity, nutrient deficiency, compaction).
3. Recommend amendments with rates (lime, fertilizer, organic matter, gypsum).
4. Rate overall suitability as high, moderate, low, or unsuitable with the primary constraints listed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
