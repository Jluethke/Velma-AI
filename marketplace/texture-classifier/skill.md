# Texture Classifier

Classify soil texture from particle size analysis: assign USDA texture class, estimate hydrological properties, and assess structural implications.

## Inputs

- `organized-results`: Sand, silt, and clay percentages for each sample
- `sampling-metadata`: Land use and management context

## Outputs

- `texture-classification`: USDA texture class for each sample with position on the texture triangle
- `hydraulic-estimates`: Estimated water-holding capacity, infiltration rate, and drainage class

## Process

1. Plot each sample on the USDA soil texture triangle using sand, silt, and clay percentages.
2. Assign the texture class (sand, loam, clay, etc.) from the triangle position.
3. Estimate water-holding capacity using pedotransfer functions.
4. Note management implications: heavy clays need different tillage than sands.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
