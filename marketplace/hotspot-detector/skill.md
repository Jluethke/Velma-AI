# Hotspot Detector

Identify statistically significant clusters of high and low values using Getis-Ord Gi* or kernel density estimation.

## Inputs

- `enriched-surface`: Predicted values with contextual attributes
- `hotspot-method`: Getis-Ord Gi*, kernel density, or DBSCAN

## Outputs

- `hotspot-map`: Map of statistically significant hot and cold spots
- `hotspot-table`: Table of hotspot locations with z-scores and p-values

## Process

1. Apply the selected hotspot detection method.
2. Correct for multiple comparisons (Bonferroni or FDR).
3. Classify each location as hot spot, cold spot, or not significant.
4. Tabulate the significant clusters with their spatial extent.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
