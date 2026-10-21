# Air Mass Trajectory Analysis

Compute backward and forward air mass trajectories to identify source regions and transport pathways for observed pollutants or meteorological events.

## Inputs

- `boundary-layer-heights`: BL height data to set trajectory arrival heights
- `measurement-period`: Dates and times of interest for trajectory computation

## Outputs

- `trajectory-ensemble`: Multi-height, multi-model trajectory sets with source region classification
- `source-attribution`: Probability maps of source region contribution based on trajectory density and residence time

## Process

1. Run HYSPLIT or FLEXPART backward trajectories at multiple arrival heights within and above the BL
2. Classify trajectory clusters by source region using geographic or land-use masks
3. Compute concentration-weighted trajectory (CWT) or potential source contribution function (PSCF) maps
4. Cross-reference high-pollution events with trajectory clusters to attribute source regions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
